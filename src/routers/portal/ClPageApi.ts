import { NebulaKoaContext, NebulaErrors, QueryParser } from 'nebulajs-core'
import { Op } from 'sequelize'
import { PageService } from '../../services/PageService'
import { MenuService } from '../../services/app/MenuService'
import { ClPage } from '../../models/ClPage'
import { ApplicationErrors } from '../../config/errors'
import { ClApplication } from '../../models/ClApplication'

export = {
    'post /cl-page': async function (ctx, next) {
        ctx.checkRequired(['url', 'name'])
        const body = ctx.request.body
        const count = await ClPage.count({
            where: {
                [Op.or]: [
                    {
                        appId: ctx.appId,
                        url: body.url,
                    },
                    {
                        isInternal: true,
                        url: body.url,
                    },
                ],
            },
        })
        if (count > 0) {
            return ctx.bizError(ApplicationErrors.PageUrlExist)
        }
        const filenameIndex = body.url.lastIndexOf('/')
        const appModel = await ClApplication.getByPk(ctx.appId)
        const createdPage = PageService.createPage(appModel, body)

        // 只加页面不绑定菜单时，会有缓存
        await MenuService.clearMenuNavCache(appModel.id)
        ctx.ok(createdPage)
    },

    'put /cl-page': async function (ctx, next) {
        ctx.checkRequired(['id', 'url', 'name'])
        const { id, name, url, schema } = ctx.request.body
        const model = await ClPage.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const appModel = await ClApplication.getByPk(ctx.appId)
        model.set({
            name,
            url,
        })
        await model.save()
        await MenuService.clearMenuNavCache(appModel.id)
        ctx.ok()
    },

    'get /cl-page/lock/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const { login } = ctx.state.user
        const model = await ClPage.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        await PageService.lockPage(model, login)
        ctx.ok()
    },

    'delete /cl-page/:id': async (ctx, next) => {
        const id = ctx.getParam('id')
        const model = await ClPage.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        await PageService.deletePage(model)
        ctx.ok()
    },

    'get /cl-page': async function (ctx, next) {
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await ClPage.findAndCountAll({
            where: {
                [Op.and]: {
                    [Op.or]: [{ appId: ctx.appId }, { isSystem: true }],
                    ...where,
                },
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
            // include: includeModels,
            attributes: {
                exclude: ['schema'],
            },
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    'post /cl-page/sync-forms': async (ctx, next) => {
        const { id, sourceFormType, syncCreate, syncUpdate, syncDetail } =
            ctx.request.body
        const model = await ClPage.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        await PageService.syncForms(model, {
            sourceFormType,
            syncCreate,
            syncUpdate,
            syncDetail,
        })
        ctx.ok()
    },

    'put /cl-page/schema': async function (ctx, next) {
        ctx.checkRequired('id')
        const { id, schema } = ctx.request.body
        const { login } = ctx.state.user
        await PageService.savePageSchema(id, schema, login)
        ctx.ok()
    },

    /**
     * 获取页面Schema（其他应用页面，portal页面设计用）
     * @param ctx
     * @param next
     * @returns {Promise<void>}
     */
    'get /cl-page/schema/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const schema = await PageService.readPageSchemaFromAppSource(id)
        ctx.ok(schema)
    },
}
