import { ApplicationConfigService } from '../../services/ApplicationConfigService'
import { Constants, NebulaBizError, QueryParser } from 'nebulajs-core'
import { ApplicationErrors } from '../../config/errors'
import { AuditModelProps, Websocket } from '../../config/constants'
import { ClAppProfile } from '../../models/ClAppProfile'
import { ClMiddleware } from '../../models/ClMiddleware'
import { SocketEvent } from 'nebulajs-core/lib/constants'
import { ApplicationService } from '../../services/ApplicationService'

export = {
    'post /cl-app-profile': async function (ctx, next) {
        ctx.checkRequired('id')
        const id = ctx.getParam('id')
        const appId = ctx.appId
        const { databaseIns, redisIns, authConfig } = ctx.request.body
        const model = await ClAppProfile.getByPk(id)
        model.set({
            ...ctx.request.body,
            appId,
        })
        if (databaseIns) {
            const { dataValues } = await ClMiddleware.getByPk(databaseIns)
            const { name: databaseName } = dataValues
            model.set({ databaseName })
        }
        if (redisIns) {
            const { dataValues } = await ClMiddleware.getByPk(redisIns)
            const { name: redisName } = dataValues
            model.set({ redisName })
        }

        if (authConfig) {
            // Auth
            model.set({
                authConfigText: JSON.stringify(authConfig),
            })
        }

        // 保存
        await model.save()

        // 刷新缓存
        await ApplicationService.setupCloudConfig(model)

        // 发送ws消息给客户端
        const { env } = model.dataValues
        const socketKey = Websocket.getAppSocketKey(model.app.id, env)
        const socket = nebula.socketMap.get(socketKey)
        if (socket) {
            socket.emit(SocketEvent.RefreshConfig, {})
        }

        ctx.ok()
    },

    'post /cl-app-profile/content': async function (ctx, next) {
        const {
            databaseIns,
            redisIns,
            logLevel,
            env,
            authConfig = {},
        } = ctx.request.body
        const text = await ApplicationConfigService.getConfigContent({
            appId: ctx.appId,
            databaseIns,
            redisIns,
            logLevel,
            env,
            authConfig,
        })
        ctx.ok({ content: text, authConfig })
    },

    'get /cl-app-profile': async function (ctx, next) {
        const appId = ctx.appId
        const { page = 1, size = 20 } = QueryParser.parseFilter(
            ctx.request.query,
            ClAppProfile
        )
        const offset = (page - 1) * size
        const { count, rows } = await ClAppProfile.findAndCountAll({
            where: {
                appId,
            },
            offset: offset < 0 ? 0 : offset,
            limit: size,
            attributes: {
                exclude: [...AuditModelProps],
            },
        })
        const list = rows.map((pro) => {
            const profile = {
                ...pro.dataValues,
                authConfig: JSON.parse(pro.authConfigText || '{}'),
            }
            // profile.authConfig.certificate2 = profile.authConfig.certificate.re
            delete profile.authConfigText
            return profile
        })
        ctx.ok(list)
        ctx.set('X-Total-Count', count)
    },
}
