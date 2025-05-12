import { FileService } from '../../services/app/FileService'

export = {
    'post /file/archive': async (ctx, next) => {
        const fileService = new FileService(ctx.clientApp.code)
        const keys = ctx.getParam('keys')
        const bucket = ctx.getParam('bucket')
        const keyList = keys.split(',')

        const targetBucket = bucket
            ? `${fileService.bucketPrefix}-${bucket}`
            : fileService.publicBucket

        const newKeys = await fileService.archiveFiles(keyList, targetBucket)
        const files = []
        for (const key of newKeys) {
            const url = await fileService.getPublicURL(key)
            files.push({
                key,
                url,
            })
        }
        ctx.ok(files)
    },
}
