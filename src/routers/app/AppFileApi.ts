import { UserErrors } from '../../config/errors'
import { NebulaBizError, NebulaErrors } from 'nebulajs-core'
import { FileService } from '../../services/app/FileService'
import fs from 'fs'
export = {
    'post /app-file/upload': async function (ctx, next) {
        const { file } = ctx.request.files
        const fileService = new FileService(ctx.clientApp.code)
        const { fileKey, url, name } = await fileService.putTempFile(
            file.originalFilename,
            fs.createReadStream(file.filepath)
        )
        ctx.ok({ value: fileKey, url, filename: name })
    },

    'get /app-file/download': async function (ctx, next) {
        ctx.checkRequired(['key'])
        const key = ctx.getParam('key')
        const fileService = new FileService(ctx.clientApp.code)
        const url = await fileService.getDownloadURL(key)
        ctx.ok({ url })
    },
}
