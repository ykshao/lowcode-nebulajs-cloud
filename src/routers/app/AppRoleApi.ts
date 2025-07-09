import { NebulaBizError, NebulaErrors, QueryParser } from 'nebulajs-core'
import { Op } from 'sequelize'
import { ApplicationErrors, UserErrors } from '../../config/errors'
import {
    AuditModelProps,
    Cache,
    DataStatus,
    ForbiddenUpdateAppModelProps,
} from '../../config/constants'
import { RoleService } from '../../services/app/RoleService'
import { MenuService } from '../../services/app/MenuService'
import { AppRole } from '../../models/AppRole'
import { AppMenu } from '../../models/AppMenu'
import { AppResource } from '../../models/AppResource'

export = {
    'post /app-role/allocate/menus': async function (ctx, next) {
        ctx.checkRequired(['menuIds', 'roleIds'])
        const { menuIds, roleIds } = ctx.request.body
        await RoleService.allocateMenus(ctx.clientAppId, menuIds, roleIds)
        await MenuService.clearMenuNavCache(ctx.clientAppId)
        ctx.ok()
    },

    'post /app-role/allocate/resources': async function (ctx, next) {
        ctx.checkRequired(['resIds', 'roleIds'])
        const { resIds, roleIds } = ctx.request.body
        await RoleService.allocateResources(ctx.clientAppId, resIds, roleIds)
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
            distinct: true, // 不加此选项查询数据会重复，count不准确
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

        let model: AppRole = null
        const body = ctx.request.body
        const role = await RoleService.getRoleByCodeAndAppId(
            ctx.clientAppId,
            body.code
        )

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
            // 验证Client权限
            ctx.checkClientAuth(model)
            // 去掉不可更新字段
            ForbiddenUpdateAppModelProps.forEach((p) => delete body[p])
            model.set(body)
            model = await model.save()
        } else {
            // 新增
            if (role) {
                throw new NebulaBizError(UserErrors.RoleCodeExist)
            }
            model = await AppRole.create({
                ...body,
                appId: ctx.clientAppId,
                status: true,
            })
        }

        ctx.ok(model.dataValues)
    },

    'get /app-role/:id/resources': async function (ctx, next) {
        const id = ctx.getParam('id')
        const role = await AppRole.findOne({
            where: {
                id,
                appId: ctx.clientAppId,
            },
            include: [
                {
                    model: AppResource,
                    as: 'resources',
                    attributes: {
                        exclude: ['appId', ...AuditModelProps],
                    },
                },
            ],
        })
        ctx.ok(role.dataValues)
    },

    'delete /app-role/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const model = await AppRole.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.checkClientAuth(model)

        // model.set({ status: DataStatus.DISABLED })
        // await model.save()
        await model.destroy()
        ctx.ok()
    },
}
