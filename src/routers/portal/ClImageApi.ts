import { NebulaErrors, QueryParser } from 'nebulajs-core'
import { Op } from 'sequelize'
import { ClImage } from '../../models/ClImage'
import { ApplicationService } from '../../services/ApplicationService'

export = {
    'get /cl-image': async function (ctx, next) {
        const appId = ctx.appId
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await ClImage.findAndCountAll({
            where: {
                ...where,
                appId,
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    // 'get /cl-image/versions': async function (ctx, next) {
    //     const appId = ctx.appId
    //     const versions = (
    //         await ClImage.findAll({
    //             // attributes: ['version', 'remark'],
    //             where: {
    //                 appId,
    //                 version: {
    //                     [Op.not]: null,
    //                 },
    //             },
    //             order: [['createdAt', 'desc']],
    //         })
    //     ).map((v) => v.dataValues)
    //     ctx.ok(versions)
    // },

    /**
     * 应用打包
     * 生成Docker镜像
     * @param ctx
     * @param next
     * @returns {Promise<any>}
     */
    'post /cl-image/build': async function (ctx, next) {
        const { version, type, remark } = ctx.request.body
        const model = await ApplicationService.getCurrentApplication(ctx)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        await ApplicationService.buildAppImage(model, version, type, remark)
        ctx.ok()
    },

    'delete /cl-image/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const image = await ClImage.getByPk(id)
        if (!image) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const app = await ApplicationService.getCurrentApplication(ctx)
        await ApplicationService.deleteAppImage(app, image)
        ctx.ok()
    },
}
