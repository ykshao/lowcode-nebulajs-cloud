import { Op } from 'sequelize'
import { AppRole } from '../../models/AppRole'
import { AppMenu } from '../../models/AppMenu'
import { AppResource } from '../../models/AppResource'

export class RoleService {
    /**
     * 根据Code查询角色
     * @param appId
     * @param code
     */
    static async getRoleByCodeAndAppId(appId, code) {
        const model = await AppRole.findOne({
            where: {
                appId,
                code,
            },
        })
        return model
    }

    /**
     * 根据code列表查询角色列表（包含菜单）
     * @param appId
     * @param roleCodes
     */
    static async findRolesByCodesWithMenus(appId, roleCodes) {
        const model = await AppRole.findAll({
            where: {
                appId,
                code: {
                    [Op.in]: roleCodes,
                },
            },
            include: [
                {
                    model: AppMenu,
                    as: 'menus',
                    attributes: ['id'],
                },
            ],
        })
        return model
    }

    /**
     * 角色分配菜单
     * @param appId
     * @param menuIds
     * @param roleIds
     */
    static async allocateMenus(appId, menuIds, roleIds) {
        const roleModels = await AppRole.findAll({
            where: {
                id: { [Op.in]: roleIds },
                appId,
            },
            include: {
                model: AppMenu,
                as: 'menus',
            },
        })
        const menuModels = await AppMenu.findAll({
            where: {
                id: { [Op.in]: menuIds },
                [Op.or]: [{ appId }, { isSystem: true }],
            },
        })
        for (const rm of roleModels) {
            const roleMenus = rm.menus
            const roleMenuIds = rm.menus.map((r) => r.id)

            // 新增
            for (const mm of menuModels) {
                if (!roleMenuIds.includes(mm.dataValues.id)) {
                    await rm.addMenu(mm)
                }
            }

            // 删除
            for (const mm of roleMenus) {
                if (!menuIds.includes(mm.dataValues.id)) {
                    await rm.removeMenu(mm)
                }
            }
        }
    }

    static async allocateResources(appId, resIds, roleIds) {
        const roleModels = await AppRole.findAll({
            where: {
                id: { [Op.in]: roleIds },
                appId,
            },
            include: {
                model: AppResource,
                as: 'resources',
            },
        })
        const resModels = await AppResource.findAll({
            where: {
                id: { [Op.in]: resIds },
                //[Op.or]: [{ appId }, { isSystem: true }],
                appId,
            },
        })
        for (const rm of roleModels) {
            const roleResources = rm.resources
            const roleResourceIds = rm.resources.map((r) => r.id)

            // 新增
            for (const mm of resModels) {
                if (!roleResourceIds.includes(mm.dataValues.id)) {
                    await rm.addResource(mm)
                }
            }

            // 删除
            for (const mm of roleResources) {
                if (!resIds.includes(mm.dataValues.id)) {
                    await rm.removeResource(mm)
                }
            }
        }
    }
}
