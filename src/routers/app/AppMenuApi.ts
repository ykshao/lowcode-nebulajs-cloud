import { NebulaKoaContext, NebulaErrors, QueryParser } from 'nebulajs-core'
import { Cache, AuditModelProps } from '../../config/constants'
import { MenuService } from '../../services/app/MenuService'
import { Op } from 'sequelize'
import { AppMenu } from '../../models/AppMenu'
import { ClPage } from '../../models/ClPage'
import { TreeUtils } from 'nebulajs-core/lib/utils'

export = {
    /**
     * @swagger
     *
     * /app-menu/nav:
     *   post:
     *     summary: 获取应用菜单
     *     tags:
     *       - 菜单
     *     produces:
     *       - application/json
     *     parameters:
     *     responses:
     *       200:
     *         description: ok
     */
    'get /app-menu/nav': async function (ctx, next) {
        const { login } = ctx.state.user
        const key = Cache.getAppUserMenuNavKey(ctx.clientAppId, login)
        let navCache: any = await nebula.redis.get(key)
        if (!navCache) {
            const groups = await MenuService.getMenuNav(ctx.clientAppId, login)
            if (groups.length > 0) {
                navCache = {
                    pages: groups,
                }
                await nebula.redis.set(key, JSON.stringify(navCache))
                await nebula.redis.expire(key, 3600 * 4)
            }
        } else {
            navCache = JSON.parse(navCache)
        }
        ctx.ok(navCache)
    },

    'get /app-menu/tree': async function (ctx, next) {
        const list = (
            await AppMenu.findAll({
                where: {
                    [Op.or]: [{ appId: ctx.clientAppId }, { isSystem: true }],
                },
                order: [['seq', 'asc']],
                attributes: {
                    exclude: AuditModelProps,
                },
            })
        ).map((item) => item.dataValues as any)
        const treeList = TreeUtils.getTreeList(list, (item: any) => {
            item.value = item.id
        })
        ctx.ok({
            pages: treeList,
        })
    },

    'post /app-menu': async function (ctx, next) {
        const body = ctx.request.body
        const [{ dataValues }] = await AppMenu.upsert({
            ...body,
            appId: ctx.clientAppId,
        })
        await MenuService.clearMenuNavCache(ctx.clientAppId)

        ctx.ok(dataValues)
    },

    'post /app-menu/bind': async function (ctx, next) {
        ctx.checkRequired(['menuId', 'pageId'])
        const id = ctx.getParam('menuId')
        const pageId = ctx.getParam('pageId')
        const model = await AppMenu.getByPk(id)
        const page = await ClPage.getByPk(pageId)
        if (!model || !page) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        model.set({ url: page.url })
        const updated = await model.save()

        await MenuService.clearMenuNavCache(ctx.clientAppId)

        ctx.ok(updated.dataValues)
    },

    'post /app-menu/unbind': async function (ctx, next) {
        ctx.checkRequired(['menuId'])
        const id = ctx.getParam('menuId')
        const model = await AppMenu.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        model.set({ url: null })
        const updated = await model.save()

        await MenuService.clearMenuNavCache(ctx.clientAppId)

        ctx.ok(updated.dataValues)
    },

    /**
     * 删除本菜单，并删除子菜单
     * @param ctx
     * @param next
     * @returns {Promise<void>}
     */
    'delete /app-menu/:id': async function (ctx, next) {
        ctx.checkRequired('id')
        const id = ctx.getParam('id')
        const model = await AppMenu.getByPk(ctx.params.id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        const list = (
            await AppMenu.findAll({
                where: {
                    appId: ctx.clientAppId,
                },
                attributes: {
                    exclude: AuditModelProps,
                },
            })
        ).map((item) => item.dataValues as any)
        const tree = TreeUtils.getTreeObject(id, list)
        const treeIds = TreeUtils.getTreeChildrenIds(tree)
        treeIds.push(tree.id)

        await AppMenu.destroy({
            where: {
                id: treeIds,
            },
            individualHooks: true,
        })

        await MenuService.clearMenuNavCache(ctx.clientAppId)

        ctx.ok()
    },

    'get /app-menu': async function (ctx, next) {
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await AppMenu.findAndCountAll({
            where: {
                ...where,
                [Op.or]: [{ appId: ctx.clientAppId }, { isSystem: true }],
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },
}
