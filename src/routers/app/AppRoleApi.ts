import { NebulaBizError, NebulaErrors, QueryParser } from 'nebulajs-core'
import { Op } from 'sequelize'
import { ApplicationErrors, UserErrors } from '../../config/errors'
import { Cache, DataStatus } from '../../config/constants'
import { RoleService } from '../../services/app/RoleService'
import { MenuService } from '../../services/app/MenuService'
import { AppRole } from '../../models/AppRole'
import { AppMenu } from '../../models/AppMenu'

export = {
    'post /app-role/allocate/menus': async function (ctx, next) {
        ctx.checkRequired(['menuIds', 'roleIds'])
        const { menuIds, roleIds } = ctx.request.body
        await RoleService.allocateMenus(ctx.clientAppId, menuIds, roleIds)
        await MenuService.clearMenuNavCache(ctx.clientAppId)
        ctx.ok()
    },

    'get /app-role': async function (ctx, next) {
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await AppRole.findAndCountAll({
            where: {
                ...where,
                appId: ctx.clientAppId,
            },
            include: [
                {
                    model: AppMenu,
                    as: 'menus',
                    attributes: ['id', 'label'],
                },
            ],
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    'post /app-role': async function (ctx, next) {
        ctx.checkRequired(['code'])

        let model = null
        const body = ctx.request.body
        const role = await RoleService.getRoleByCodeAndAppId(
            ctx.clientAppId,
            body.code
        )

        body.appId = ctx.clientAppId
        body.status = true
        if (body.id) {
            // 更新
            model = await AppRole.getByPk(body.id)
            if (!model) {
                throw new NebulaBizError(
                    NebulaErrors.BadRequestErrors.DataNotFound
                )
            }
            if (role && role.dataValues.id !== model.dataValues.id) {
                throw new NebulaBizError(UserErrors.RoleCodeExist)
            }
            model.set(body)
            model = await model.save()
        } else {
            // 新增
            if (role) {
                throw new NebulaBizError(UserErrors.RoleCodeExist)
            }
            model = await AppRole.create(body)
        }

        ctx.ok(model.dataValues)
    },

    'delete /app-role/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const model = await AppRole.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        // model.set({ status: DataStatus.DISABLED })
        // await model.save()
        await model.destroy()
        ctx.ok()
    },
}
