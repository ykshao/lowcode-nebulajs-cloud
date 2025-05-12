import { Cache, Cookies } from '../config/constants'
import { ApplicationErrors } from '../config/errors'
import { NebulaErrors, AccessManager } from 'nebulajs-core'

export function portalExtension({ logger, routePath }) {
    const whitePathList = [
        'post ^/portal/cl-application$',
        'post ^/portal/cl-application/recreate$',
        'get ^/portal/cl-application$',
        'get ^/portal/cl-application/servers$',
        'get ^/portal/cl-page/.+',
        'get ^/portal/cl-application/switch/.+',
    ]
    const manager = new AccessManager({ whitePathList })

    return async (ctx, next) => {
        logger.debug('app-extension start >>>')

        // 前缀不匹配则忽略
        if (!ctx.path.startsWith(routePath)) {
            return await next()
        }

        // 白名单
        if (manager.isWhitePath(ctx)) {
            return await next()
        }

        const appId =
            ctx.cookies.get(Cookies.CURRENT_APP_ID) ||
            ctx.getParam(Cookies.CURRENT_APP_ID)
        if (!appId) {
            return ctx.bizError(ApplicationErrors.NoApplication)
        }

        // 是否可以存储到cookie,一个浏览器开多个网页，有问题？
        ctx.appId = appId
        ctx.cookies.set(Cookies.CURRENT_APP_ID, appId)
        await next()

        logger.debug('app-extension end >>>')
    }
}
