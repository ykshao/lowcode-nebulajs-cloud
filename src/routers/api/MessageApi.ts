import { AppMessage } from '../../models/AppMessage'
import { Cache, UserMessageTypes } from '../../config/constants'
import { NebulaBizError } from 'nebulajs-core'
import { ApplicationErrors } from '../../config/errors'
import { AuthenticateErrors } from 'nebulajs-core/lib/error/def'

export = {
    'post /app-message/send': async function (ctx, next) {
        ctx.checkRequired(['login', 'title', 'type'])
        const appId = ctx.clientAppId
        const {
            login,
            mobile,
            name,
            type,
            title,
            content,
            link,
            extra,
            source,
        } = ctx.request.body
        const messageTypes = Object.keys(UserMessageTypes).map(
            (key) => UserMessageTypes[key]
        )
        // if (!messageTypes.includes(type)) {
        //     throw new NebulaBizError(ApplicationErrors.MessageTypeNotSupported)
        // }

        await AppMessage.create({
            login,
            mobile,
            name, // 姓名
            type,
            title,
            content,
            extra,
            read: false,
            link,
            appId,
            createdBy: source || 'system',
            updatedBy: source || 'system',
        })

        // 删除消息缓存
        const key = Cache.getAppUserMessageCountKey(ctx.clientAppId, login)
        await nebula.redis.del(key)
        ctx.ok()
    },

    'get /app-message/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const message = await AppMessage.getByPk(id)
        if (message.appId !== ctx.clientAppId) {
            throw new NebulaBizError(AuthenticateErrors.AccessForbidden)
        }
        ctx.ok(message)
    },
}
