import {
    QueryParser,
    NebulaKoaContext,
    BaseModel,
    NebulaBizError,
} from 'nebulajs-core'
import { ApiErrors, ApplicationErrors } from '../../config/errors'
import { ApiService } from '../../services/ApiService'
import { ClApi } from '../../models/ClApi'

export = {
    'get /cl-api': async function (ctx, next) {
        const appId = ctx.appId
        const {
            where,
            include,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query, ClApi)
        const offset = (page - 1) * size
        const { count, rows } = await ClApi.findAndCountAll({
            where: {
                ...where,
                appId,
            },
            include: include,
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    /**
     *
     * @param ctx {NebulaKoaContext}
     * @param next
     * @returns {Promise<void>}
     */
    'post /cl-api': async function (ctx, next) {
        ctx.checkRequired(['name', 'path', 'method'])
        const appId = ctx.appId
        const id = ctx.getParam('id')
        const body = { ...ctx.request.body, appId }
        let model: ClApi | null = null
        if (id) {
            model = await ApiService.updateApi(body)
        } else {
            model = await ApiService.createApi(body)
        }
        ctx.ok(model?.dataValues)
    },

    'delete /cl-api/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        await ApiService.deleteApi(id)
        ctx.ok()
    },
}
