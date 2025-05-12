import { Cache, DataStatus } from '../../config/constants'
import { ApplicationService } from '../../services/ApplicationService'
import { ClAppProfile } from '../../models/ClAppProfile'
import { ClApplication } from '../../models/ClApplication'

export = {
    /**
     * 客户端SDK拉取配置
     * @param ctx
     * @param next
     */
    'get /config/pull': async function (ctx, next) {
        const key = Cache.getAppConfigKey(ctx.clientEnv, ctx.clientAppId)
        const config = await nebula.redis.get(key)
        ctx.ok(JSON.parse(config || '{}'))
    },
}
