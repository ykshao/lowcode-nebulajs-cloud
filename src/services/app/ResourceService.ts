import { AppResource } from '../../models/AppResource'
import { AuditModelProps, Cache, DataStatus } from '../../config/constants'
import { TreeUtils } from 'nebulajs-core/lib/utils'
import { TreeNode } from 'nebulajs-core'
import { AppRole } from '../../models/AppRole'
import { Op } from 'sequelize'

export class ResourceService {
    static async getResourceTree(appId) {
        const list = await AppResource.findAll({
            where: {
                [Op.or]: [{ appId }, { isSystem: true }],
            },
            order: [
                ['group', 'asc'],
                ['url', 'asc'],
            ],
            attributes: {
                exclude: AuditModelProps,
            },
        })

        const pageList: TreeNode[] = []
        const resList: TreeNode[] = []
        list.map((r) => r.dataValues).forEach((r) => {
            r.group = r.group || '系统资源'
            r.name = r.name || ''
            if (!pageList.find((p) => p.id === r.group)) {
                pageList.push({
                    id: r.group,
                    pid: null,
                    seq: 0,
                    children: [],
                    label: r.group,
                })
            }
            resList.push({
                ...r,
                pid: r.group,
                seq: 1,
                children: [],
                label: r.name + ':' + r.method + ' ' + r.url,
            })
        })

        const treeList = TreeUtils.getTreeList(
            pageList.concat(resList),
            (item: any) => {
                item.value = item.id
            }
        )
        return treeList
    }
    static async findResourcesByRoleCodes(
        appId,
        roleCodes: string[]
    ): Promise<string[]> {
        const resModels = await AppResource.findAll({
            where: {
                [Op.or]: [{ appId }, { isSystem: true }],
                regexp: {
                    [Op.not]: null,
                },
            },
            include: {
                model: AppRole,
                as: 'roles',
                where: {
                    code: { [Op.in]: roleCodes },
                    appId,
                },
            },
        })
        return resModels.map((r) => {
            return r.method + ' ' + r.regexp.substring(1, r.regexp.length - 2)
        })
    }

    static async clearAppResourceCache(appId) {
        const delKeys = await nebula.redis.keys(Cache.getAppResourceKey(appId))
        if (delKeys.length > 0) {
            await nebula.redis.del(delKeys)
        }
    }
}
