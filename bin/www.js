#!/usr/bin/env node

const { Websocket } = require('../dist/config/constants')
const { Server, Socket } = require('socket.io')
const { AuthUtils } = require('nebulajs-core/lib/utils')
const Koa = require('koa')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const port = process.env.HTTP_PORT || 3000
const wsPort = process.env.WS_PORT || 3001
const { startup } = require('../dist/app.js')
const { ClApplication } = require('../dist/models/ClApplication')
/**
 *
 * @param instance {NebulaApp}
 */
function startWsServer(instance) {
    /**
     * @type {Map<string, Socket>}
     */
    const socketMap = new Map()
    const wsApp = new Koa()
    const wsServer = http.createServer(wsApp.callback())
    const socketIO = new Server(wsServer, { transports: ['websocket'] })
    const { logger } = instance

    // Web Socket Server
    socketIO.on('connection', async (socket) => {
        // logger.info('websocket on connection: %s', socket.id)
        // console.log('websocket connection.', client.id)
        const { appId, env, timestamp, sign } = socket.handshake.auth
        const socketKey = Websocket.getAppSocketKey(appId, env)
        try {
            if (socketMap.get(socketKey)) {
                throw new Error('client socket already connected.')
            }
            const appModel = await ClApplication.getByPk(appId)
            const { clientId, clientSecret } = appModel.dataValues
            const result = AuthUtils.verifyClientSign(clientId, clientSecret, {
                env,
                timestamp,
                sign,
            })
            if (!result) {
                throw new Error('client sign not matched.')
            }
            //
            socketMap.set(socketKey, socket)
            socket.on('disconnect', (reason) => {
                logger.info('websocket disconnect: %s', reason)
                socketMap.delete(socketKey)
            })
            logger.info(
                'app socket connected, id:%s, code:%s, env:%s',
                socket.id,
                appModel.code,
                env
            )
        } catch (e) {
            logger.warn(
                'connect socket id: %s, error: %o',
                socket.id,
                e.message
            )
            socket.disconnect(true)
        }
    })
    wsServer.listen(wsPort, '0.0.0.0', () => {
        logger.info('Websocket server started.')
    })

    nebula.socketMap = socketMap
}
startup(port)
    .then((instance) => {
        // Websocket Server
        startWsServer(instance)
    })
    .catch((err) => {
        console.error(err)
    })
