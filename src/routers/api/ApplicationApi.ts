import { NebulaErrors } from 'nebulajs-core'
import { ClApplication } from '../../models/ClApplication'

export = {
    'get /application/current': async function (ctx, next) {
        const model = await ClApplication.getByPk(ctx.clientAppId)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.ok(model)
    },
}
