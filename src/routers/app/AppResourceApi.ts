import { ResourceService } from '../../services/app/ResourceService'

export = {
    'get /app-resource/tree': async function (ctx, next) {
        const treeList = await ResourceService.getResourceTree(ctx.clientAppId)
        ctx.ok(treeList)
    },
}
