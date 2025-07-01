import { NebulaErrors, QueryParser } from 'nebulajs-core'
import { ProcessService } from '../../services/ProcessService'
import { CamundaService } from '../../services/common/CamundaService'
import { ProcessErrors } from '../../config/errors'
import { AppProcessDef } from '../../models/AppProcessDef'
import { DataStatus } from '../../config/constants'
import { UserService } from '../../services/app/UserService'

export = {
    /**
     * 启动模型流程（SDK调用提交）
     * @param ctx
     * @param next
     */
    'post /process-def/start/model': async function (ctx, next) {
        ctx.checkRequired(['model', 'businessKey', 'startUserId'])
        const formModel = ctx.getParam('model')
        const businessKey = ctx.getParam('businessKey')
        const startUserId = ctx.getParam('startUserId')
        const variables = ctx.getParam('variables')
        const summary = ctx.getParam('summary')

        // 获取最新流程定义
        const list = await AppProcessDef.findAll({
            where: {
                formModel,
                appId: ctx.clientAppId,
                status: DataStatus.ENABLED,
            },
            attributes: {
                exclude: ['formSchema', 'processJson', 'settings'],
            },
            order: [['version', 'desc']],
        })
        if (list.length === 0) {
            return ctx.bizError(ProcessErrors.ProcessModelNotBound)
        }
        const processDef = list[0]
        const startUser = await UserService.getUserByLoginAndAppId(
            ctx.clientAppId,
            startUserId
        )
        const extraInfo = {
            summary,
            startUserName: startUser?.name,
            formModel,
            formName: processDef.formName,
            definitionName: processDef.name,
            definitionIcon: processDef.icon,
        }
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const result = await processService.startProcess({
            processDefId: processDef.camundaProcessId,
            variables,
            businessKey,
            startUserId,
            extraInfo,
        })
        ctx.ok(result)
    },

    /**
     * 取消模型流程（SDK调用撤回）
     * @param ctx
     * @param next
     */
    'post /process-def/cancel/model': async function (ctx, next) {
        ctx.checkRequired(['model', 'businessKey'])
        const formModel = ctx.getParam('model')
        const businessKey = ctx.getParam('businessKey')
        const processDefList = await AppProcessDef.findAll({
            where: {
                formModel,
                appId: ctx.clientAppId,
                // status: DataStatus.ENABLED,
            },
            order: [['version', 'desc']],
            attributes: {
                exclude: ['formSchema', 'processJson', 'settings'],
            },
        })
        if (processDefList.length === 0) {
            return ctx.bizError(ProcessErrors.ProcessModelNotBound)
        }

        // 取消这条数据相关的所有流程（如果流程重新发布过，会出现多个版本的流程实例）
        // 多次发布流程Key一样，用流程key取消
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const result = await processService.cancelProcess({
            processDefinitionKey: processDefList[0].camundaProcessKey,
            businessKey,
        })
        ctx.ok(result)
    },
}
