import { AppMenu } from '../../models/AppMenu'
import { Op } from 'sequelize'
import { AuditModelProps } from '../../config/constants'
import { TreeUtils } from 'nebulajs-core/lib/utils'

export = {
    'get /cl-menu/tree': async (ctx, next) => {
        const list = (
            await AppMenu.findAll({
                where: {
                    [Op.or]: [{ appId: ctx.appId }, { isSystem: true }],
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
}
