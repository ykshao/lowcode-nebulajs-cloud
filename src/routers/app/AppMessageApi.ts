import { NebulaErrors, QueryParser } from 'nebulajs-core'
import { Cache, DataStatus } from '../../config/constants'
import { AppMessage } from '../../models/AppMessage'
import moment from 'moment'
import { Op } from 'sequelize'

export = {
    'post /app-message/read/:id': async function (ctx, next) {
        const msgId = ctx.getParam('id')
        const { login } = ctx.state.user
        const key = Cache.getAppUserMessageCountKey(ctx.clientAppId, login)
        const message: AppMessage = await AppMessage.findByPk(msgId)
        if (!message) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        if (message.login !== login || message.appId !== ctx.clientAppId) {
            return ctx.bizError(NebulaErrors.AuthenticateErrors.AccessForbidden)
        }
        if (message.read) {
            return ctx.ok()
        }
        message.set({
            read: true,
            readTime: moment().toDate(),
        })
        await message.save()

        // 删除消息缓存
        await nebula.redis.del(key)
        ctx.ok()
    },

    'post /app-message/delete': async (ctx, next) => {
        const { ids = [] } = ctx.request.body
        const { login } = ctx.state.user
        const rows = await AppMessage.destroy({
            where: {
                login,
                appId: ctx.clientAppId,
                id: {
                    [Op.in]: ids,
                },
            },
        })
        // 删除消息缓存
        const key = Cache.getAppUserMessageCountKey(ctx.clientAppId, login)
        await nebula.redis.del(key)
        ctx.ok({ rows })
    },

    'get /app-message/count': async function (ctx, next) {
        const { login } = ctx.state.user
        const key = Cache.getAppUserMessageCountKey(ctx.clientAppId, login)
        let count: any = await nebula.redis.get(key)
        if (count === null) {
            const { where } = QueryParser.parseFilter(ctx.request.query)
            count = await AppMessage.count({
                where: {
                    ...where,
                    read: false,
                    login,
                    appId: ctx.clientAppId,
                },
            })
            await nebula.redis.setex(key, Cache.defaultEx, count)
        }

        ctx.ok({ count })
    },

    'get /app-message': async function (ctx, next) {
        const { login } = ctx.state.user
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await AppMessage.findAndCountAll({
            where: {
                ...where,
                login,
                appId: ctx.clientAppId,
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },
}
