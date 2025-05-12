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

const pkg = require('./package.json')
const options = {
    id: pkg.nebula.id,
    clientId: pkg.nebula.clientId,
    clientSecret: pkg.nebula.clientSecret,
    name: pkg.name,
    version: pkg.version,
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
            }),
        })
    )

    // 云端接口、通过sdk代理访问
    app.middlewares.push(
        cloudExtension({ logger: app.logger, routePath: '/cloud' })
    )

    // 启动
    await app.startup({ port })

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
