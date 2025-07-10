import { AppResource } from '../../models/AppResource'
import { Op } from 'sequelize'
import crypto from 'crypto'
import { ResourceService } from '../../services/app/ResourceService'
import { Cache } from '../../config/constants'
import { UserService } from '../../services/app/UserService'

export = {
    /**
     * 客户端向云端同步资源
     * @param ctx
     * @param next
     */
    'post /resource/sync': async (ctx, next) => {
        let { resources = [] } = ctx.request.body
        // 查询所有资源
        const existResIds = await AppResource.findAll({
            where: {
                appId: ctx.clientAppId,
            },
            attributes: ['id'],
        })
        const existResIdsSet = new Set<string>(existResIds.map((r) => r.id))
        const transaction = await nebula.sequelize.transaction()
        try {
            for (const r of resources) {
                const res: AppResource = r
                if (res.url.startsWith('/app/')) {
                    res.isSystem = true
                }
                const [model, ret] = await AppResource.upsert(
                    {
                        ...res,
                        appId: ctx.clientAppId,
                    },
                    {
                        transaction,
                    }
                )

                // 删除已处理的资源Key
                existResIdsSet.delete(res.id)
            }

            // 删除未更新的剩余资源
            await AppResource.destroy({
                where: {
                    appId: ctx.clientAppId,
                    id: {
                        [Op.in]: Array.from(existResIdsSet),
                    },
                },
                transaction,
            })

            nebula.logger.info(
                '同步应用资源成功，应用：%s，同步资源：%s，删除资源：%s',
                ctx.clientApp.code,
                resources.length,
                existResIdsSet.size
            )
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            throw e
        }
        ctx.ok()
    },
}
