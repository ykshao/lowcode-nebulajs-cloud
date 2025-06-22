import { NebulaErrors, QueryParser } from 'nebulajs-core'
import { UserErrors } from '../../config/errors'
import {
    DataStatus,
    ForbiddenUpdateAppModelProps,
} from '../../config/constants'
import { AppOrganization } from '../../models/AppOrganization'
import { AppUser, AppUserOrganization } from '../../models/AppUser'

export = {
    'get /app-org/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const instance = await AppOrganization.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.ok(instance.dataValues)
    },
    'get /app-org': async function (ctx, next) {
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await AppOrganization.findAndCountAll({
            where: {
                ...where,
                appId: ctx.clientAppId,
                status: DataStatus.ENABLED,
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    'post /app-org': async function (ctx, next) {
        const body = ctx.request.body
        let model: AppOrganization = null

        body.appId = ctx.clientAppId
        body.shortName = body.shortName || body.name
        if (body.parentId) {
            const parent = await AppOrganization.getByPk(body.parentId)
            body.parentName = parent.dataValues.shortName
        }

        if (body.id) {
            // 更新
            model = await AppOrganization.getByPk(body.id)
            if (!model) {
                return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
            }
            // 验证Client权限
            ctx.checkClientAuth(model)
            // 去掉不可更新字段
            ForbiddenUpdateAppModelProps.forEach((p) => delete body[p])

            model.set(body)
            model = await model.save()
        } else {
            // 新增
            model = await AppOrganization.create({
                ...body,
                appId: ctx.clientAppId,
                status: true,
            })
        }

        ctx.ok(model.dataValues)
    },
    'delete /app-org/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const userOrgs = await AppUserOrganization.findAll({
            where: {
                orgId: id,
            },
        })
        if (userOrgs.length > 0) {
            return ctx.bizError(UserErrors.OrgUsersExist)
        }
        const instance = await AppOrganization.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.checkClientAuth(instance)
        await instance.destroy()
        ctx.ok()
    },
}
