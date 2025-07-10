import moment from 'moment'
import {
    NebulaApp,
    AccessManager,
    NebulaBizError,
    NebulaErrors,
    authExtension,
    cloudExtension,
} from 'nebulajs-core'
import { AccessConfig, SocketEvent } from './config/constants'
import { MessageHandler } from './services/message-handler'
import { ResourceUtils } from 'nebulajs-core/lib/utils'
import { AuthenticateErrors } from 'nebulajs-core/lib/error/def'

const pkg = require('./package.json')
const options = {
    id: pkg.nebula.id,
    clientId: pkg.nebula.clientId,
    clientSecret: pkg.nebula.clientSecret,
    name: pkg.name,
    version: pkg.version,
}
async function registerClientResources() {
    const pageResources = await ResourceUtils.scanAmisResources(
        nebula.staticPath + '/schema'
    )
    const resources = ResourceUtils.findAllResources(
        ['* ^/api/.+', ...AccessConfig.whitePathList],
        pageResources
    )
    await nebula.sdk.resource.syncResources(resources)
}
async function startup(port) {
    const app = await NebulaApp.getInstance(options)

    app.middlewares.push(
        authExtension({
            logger: app.logger,
            routePath: '/',
            // accessTokenCookieName: '',
            // refreshTokenCookieName: '',
            accessManager: new AccessManager({
                whitePathList: AccessConfig.whitePathList,
                pathRewriteMap: new Map([[/^\/cloud\/(.+)/, '/$1']]), // 替换/cloud接口
                checkUserPermission: async function (ctx, user) {
                    const resources =
                        await nebula.sdk.resource.getUserResources(user.login)
                    if (!this.matchUserResource(ctx, resources)) {
                        throw new NebulaBizError(
                            AuthenticateErrors.AccessForbidden,
                            `User has no access to the url:${ctx.request.path}`
                        )
                    }
                },
            }),
        })
    )

    // 云端接口、通过sdk代理访问
    app.middlewares.push(
        cloudExtension({ logger: app.logger, routePath: '/cloud' })
    )

    // 启动
    await app.startup({ port })

    // 同步应用权限资源
    await registerClientResources()

    app.sdk.socket.on(
        SocketEvent.ProcessFormUpdate,
        MessageHandler.handleProcessFormUpdateMessage
    )
    app.sdk.socket.on(
        SocketEvent.ProcessTaskCreated,
        MessageHandler.handleProcessTaskCreatedMessage
    )
    app.sdk.socket.on(
        SocketEvent.ProcessTaskCompleted,
        MessageHandler.handleProcessTaskCompletedMessage
    )
    app.sdk.socket.on(
        SocketEvent.ProcessTaskDeleted,
        MessageHandler.handleProcessTaskDeletedMessage
    )
    app.sdk.socket.on(
        SocketEvent.ProcessInstanceCompleted,
        MessageHandler.handleProcessInstanceCompletedMessage
    )
    app.sdk.socket.on(
        SocketEvent.ProcessInstanceTerminated,
        MessageHandler.handleProcessInstanceTerminatedMessage
    )

    return app
}

module.exports = {
    startup,
}
