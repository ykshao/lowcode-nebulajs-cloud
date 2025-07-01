import { ApplicationErrors } from '../config/errors'
import {
    AccessManager,
    NebulaBizError,
    NebulaKoaContext,
    NebulaLogger,
} from 'nebulajs-core'
import { AuthenticateErrors } from 'nebulajs-core/lib/error/def'
import { AuthUtils } from 'nebulajs-core/lib/utils'
import { ClApplication } from '../models/ClApplication'
import { Model } from 'sequelize'
export function clientExtension({
    logger,
    routePath,
}: {
    logger
    routePath: string[]
}) {
    const whitePathList = []
    const manager = new AccessManager({ whitePathList })

    return async (ctx: NebulaKoaContext, next) => {
        logger.debug('client-extension start >>>')

        // 前缀不匹配则忽略
        if (!routePath.some((p) => ctx.path.startsWith(p))) {
            return await next()
        }

        // 白名单
        if (manager.isWhitePath(ctx)) {
            return await next()
        }

        /**
         * Model权限验证
         * 验证要访问的Model是否属于本App
         * @param model
         */
        ctx.checkClientAuth = function (model: Model) {
            const modelAppId = model.dataValues['appId']
            if (modelAppId && this.clientAppId !== modelAppId) {
                throw new NebulaBizError(ApplicationErrors.InvalidClientRequest)
            }
        }

        ctx.getContextParam = function (name) {
            const headers = this.headers || {}
            return (
                headers[name] ||
                headers[name.toLowerCase()] ||
                this.getParam(name) ||
                this.getParam(name.toLowerCase())
            )
        }

        // const clientToken = ctx.getCookieParam(CookieName.AccessToken)
        // console.log('clientToken', clientToken)

        // nebula.logger.debug('client-extension headers: %s', ctx.headers)
        const clientEnv = ctx.getContextParam('X-Client-Env')
        const clientId = ctx.getContextParam('X-Client-Id')
        const clientSign = ctx.getContextParam('X-Client-Sign')
        const clientUser = ctx.getContextParam('X-Client-User')
        const clientTimestamp = ctx.getContextParam('X-Client-Timestamp')

        if (!clientId || !clientSign || !clientTimestamp) {
            throw new NebulaBizError(ApplicationErrors.InvalidClientRequest)
        }
        if (!clientEnv) {
            throw new NebulaBizError(ApplicationErrors.InvalidClientEnv)
        }

        const appModel = await ClApplication.getByUniqueKey(
            'clientId',
            clientId
        )
        const clientSecret = appModel.clientSecret
        const result = AuthUtils.verifyClientSign(clientId, clientSecret, {
            env: clientEnv,
            timestamp: clientTimestamp,
            sign: clientSign,
        })

        if (!result) {
            throw new NebulaBizError(
                AuthenticateErrors.AccessForbidden,
                'client sign not matched.'
            )
        }

        //ctx.clientId = clientId // clientId只作为验证，因为可能会变掉
        ctx.clientEnv = clientEnv
        ctx.clientAppId = appModel.id
        ctx.clientApp = appModel.dataValues

        // 兼容老数据（如果没设置tenantId，用code计算）
        ctx.clientApp.camundaTenantId =
            appModel.dataValues.camundaTenantId ||
            `nebula${appModel.code.replace(/[\-_]/g, '').toLowerCase()}`

        ctx.state = ctx.state || { user: null }
        ctx.state.user = { login: clientUser }

        await next()

        logger.debug('client-extension end >>>')
    }
}
