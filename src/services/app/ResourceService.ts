import { AppResource } from '../../models/AppResource'
import { AuditModelProps } from '../../config/constants'
import { TreeUtils } from 'nebulajs-core/lib/utils'
import { TreeNode } from 'nebulajs-core'

export class ResourceService {
    static async getResourceTree(appId) {
        const list = await AppResource.findAll({
            where: {
                appId,
            },
            order: [['pageId', 'asc']],
            attributes: {
                exclude: AuditModelProps,
            },
        })

        const pageList: (TreeNode & { label: string })[] = []
        const resList: (TreeNode & { label: string })[] = []
        list.map((r) => r.dataValues).forEach((r) => {
            if (!pageList.find((p) => p.id === r.pageId)) {
                pageList.push({
                    id: r.pageId,
                    pid: null,
                    seq: 0,
                    children: [],
                    label: r.pageName,
                })
            }
            resList.push({
                ...r,
                pid: r.pageId,
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
}
