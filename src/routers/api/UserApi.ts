import { AppUser, AppUserRole } from '../../models/AppUser'
import { AppOrganization } from '../../models/AppOrganization'
import { AppRole } from '../../models/AppRole'
import { NebulaErrors, QueryParser } from 'nebulajs-core'
import { Constants, DataStatus } from '../../config/constants'
import { UserService } from '../../services/app/UserService'

export = {
    'get /user/:login': async function (ctx, next) {
        const login = ctx.getParam('login')
        const userModel = await AppUser.findOne({
            where: {
                appId: ctx.clientAppId,
                login,
            },
            include: [
                {
                    model: AppOrganization,
                    as: 'orgs',
                    attributes: [
                        'id',
                        'code',
                        'name',
                        'shortName',
                        'parentId',
                        'isComp',
                    ],
                },
                {
                    model: AppRole,
                    as: 'roles',
                    attributes: ['id', 'code', 'name'],
                },
            ],
        })
        if (!userModel) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        userModel.roles.forEach((r) => delete r.dataValues['AppUserRole'])
        userModel.orgs.forEach(
            (o) => delete o.dataValues['AppUserOrganization']
        )
        const userRoleCodes = userModel.roles.map((r) => r.code)
        ctx.ok({
            ...userModel.dataValues,
            isAdmin: userRoleCodes.includes(Constants.ROLE_ADMIN),
        })
    },

    'get /org/:code': async function (ctx, next) {
        const code = ctx.getParam('code')
        const orgModel = await AppOrganization.findOne({
            where: {
                appId: ctx.clientAppId,
                code,
            },
        })
        if (!orgModel) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.ok(orgModel.dataValues)
    },

    'get /org': async function (ctx, next) {
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

    /**
     * 用户导入（login为主键）
     * @param ctx
     * @param next
     */
    'post /user/save': async (ctx, next) => {
        ctx.checkRequired(['login'])
        const { orgCodes, roleCodes } = ctx.request.body
        const savedUser = await UserService.saveUserByLoginAndAppId(
            ctx.clientAppId,
            ctx.request.body
        )
        if (roleCodes) {
            await UserService.allocateRoles(
                savedUser.appId,
                [savedUser.id],
                roleCodes
            )
        }
        if (orgCodes) {
            await UserService.allocateOrgs(
                savedUser.appId,
                [savedUser.id],
                orgCodes
            )
        }
        ctx.ok(savedUser.dataValues)
    },

    /**
     * 组织导入（code为主键）
     * @param ctx
     * @param next
     */
    'post /org/save': async (ctx, next) => {
        ctx.checkRequired(['code'])
        const savedOrg = await UserService.saveOrgByCodeAndAppId(
            ctx.clientAppId,
            ctx.request.body
        )
        ctx.ok(savedOrg.dataValues)
    },
}
