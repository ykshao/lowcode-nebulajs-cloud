import { ClJobExecution } from '../../models/ClJobExecution'
import { NebulaErrors } from 'nebulajs-core'
import fs from 'fs'
import path from 'path'
import { JobService } from '../../services/JobService'

export = {
    /**
     * 更新任务结果
     * @param ctx
     * @param next
     */
    'post /job/execution/update': async (ctx, next) => {
        ctx.checkRequired(['id', 'status'])
        const { status, result } = ctx.request.body
        const id = ctx.getParam('id')
        const model = await ClJobExecution.findOne({
            where: {
                id,
                appId: ctx.clientAppId,
            },
        })
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        model.set({ status, result })
        await model.save()
        ctx.ok(model.dataValues)
    },

    /**
     * 打印任务日志
     * @param ctx
     * @param next
     */
    'post /job/execution/log': async (ctx, next) => {
        ctx.checkRequired(['id'])
        const { log } = ctx.request.body
        const id = ctx.getParam('id')
        const model = await ClJobExecution.findOne({
            where: {
                id,
                appId: ctx.clientAppId,
            },
        })
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        if (log && model.logfile) {
            const logFile = path.join(process.cwd(), model.logfile)
            const logPath = path.dirname(logFile)

            !fs.existsSync(logPath) &&
                fs.mkdirSync(logPath, { recursive: true })
            const writeStream = fs.createWriteStream(logFile, { flags: 'a' })
            writeStream.write(log)
            writeStream.write('\n')
            writeStream.end()
        }
        ctx.ok()
    },

    /**
     * 创建定时任务
     * @param ctx
     * @param next
     */
    'post /job/create': async (ctx, next) => {
        ctx.checkRequired(['name', 'cron', 'scriptPath'])
        const body = ctx.request.body
        const { name, cron, remark, scriptPath, env = [] } = body

        const job = await JobService.createdJob({
            name,
            cron,
            remark,
            scriptPath,
            env,
            appId: ctx.clientAppId,
        })

        ctx.ok(job.attrs)
    },

    // 'post /job/execution/stop': async (ctx, next) => {},
}
