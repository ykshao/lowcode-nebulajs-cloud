import { NebulaBizError, NebulaErrors, QueryParser } from 'nebulajs-core'
import { ProcessService } from '../../services/ProcessService'
import { CamundaService } from '../../services/common/CamundaService'
import { ProcessErrors } from '../../config/errors'
import { AppProcessGroup } from '../../models/AppProcessGroup'
import { AppProcessDef } from '../../models/AppProcessDef'
import { ClModel } from '../../models/ClModel'
import {
    DataStatus,
    ForbiddenUpdateAppModelProps,
} from '../../config/constants'

export = {
    'get /app-process-group': async function (ctx, next) {
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await AppProcessGroup.findAndCountAll({
            where: {
                ...where,
                appId: ctx.clientAppId,
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },
    'get /app-process-group/tree': async function (ctx, next) {
        const list = await AppProcessGroup.findAll({
            where: {
                appId: ctx.clientAppId,
            },
            attributes: ['id', 'name', 'tag'],
            order: [['seq', 'asc']],
        })
        const dataMap = {}
        for (const group of list) {
            const tag = group.dataValues.tag || '默认'
            if (!dataMap[tag]) {
                dataMap[tag] = {
                    id: tag,
                    name: tag,
                    children: [],
                }
            }
            dataMap[tag].children.push(group.dataValues)
        }
        ctx.ok(Object.keys(dataMap).map((k) => dataMap[k]))
    },
    'post /app-process-group': async function (ctx, next) {
        const body = ctx.request.body
        let model = null
        if (body.id) {
            // 更新
            model = await AppProcessGroup.getByPk(body.id)
            if (!model) {
                return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
            }
            // 验证Client权限
            ctx.checkClientAuth(model)
            // 去掉不可更新字段
            ForbiddenUpdateAppModelProps.forEach((p) => delete body[p])
            model.set({ ...body, appId: ctx.clientAppId })
            model = await model.save()
        } else {
            // 新增
            model = await AppProcessGroup.create({
                ...body,
                appId: ctx.clientAppId,
            })
        }
        ctx.ok(model.dataValues)
    },
    'delete /app-process-group/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const model = await AppProcessGroup.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.checkClientAuth(model)
        const count = await AppProcessDef.count({
            where: {
                appId: ctx.clientAppId,
                groupId: id,
            },
        })
        if (count > 0) {
            throw new NebulaBizError(ProcessErrors.ProcessDefGroupCannotDelete)
        }
        await model.destroy()
        ctx.ok()
    },
    'get /app-process-def': async function (ctx, next) {
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await AppProcessDef.findAndCountAll({
            where: {
                ...where,
                appId: ctx.clientAppId,
                status: DataStatus.ENABLED,
            },
            include: [
                {
                    model: AppProcessGroup,
                    as: 'group',
                    attributes: ['id', 'name'],
                },
            ],
            attributes: {
                exclude: ['formSchema', 'processJson', 'settings'],
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    'post /app-process-def/cancel': async function (ctx, next) {
        ctx.checkRequired(['businessKey', 'processDefinitionKey'])
        const processDefinitionKey = ctx.getParam('processDefinitionKey')
        const businessKey = ctx.getParam('businessKey')
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const result = await processService.cancelProcess({
            processDefinitionKey,
            businessKey,
        })
        ctx.ok(result)
    },

    'post /app-process-def/start': async function (ctx, next) {
        // 流程实例ID
        ctx.checkRequired(['processDefId', 'startUserId'])
        const processDefId = ctx.getParam('processDefId')
        const startUserId = ctx.getParam('startUserId')
        const model = await AppProcessDef.getByPk(processDefId)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        const variables = ctx.request.body
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const result = await processService.startProcess({
            processDefId: model.dataValues.camundaProcessId,
            variables,
            startUserId,
        })
        ctx.ok(result)
    },

    'delete /app-process-def/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const instance = await AppProcessDef.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.checkClientAuth(instance)
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        if (instance.dataValues.camundaProcessId) {
            try {
                await camundaService.deleteProcessDefinition(
                    instance.dataValues.camundaProcessId
                )
            } catch (e) {
                // 有未完成的流程实例，无法删除关联的定义
                const regex =
                    /ENGINE-03076 Deletion of process definition without cascading failed/
                if (e.response.body.message.match(regex)) {
                    throw new NebulaBizError(
                        ProcessErrors.ProcessDefCannotDelete
                    )
                } else if (
                    e.response.body.message.match(
                        /No process definition found with id/
                    )
                ) {
                    // 流程已经被删除不做处理
                } else {
                    throw e
                }
            }
        }
        instance.set({
            status: DataStatus.DISABLED,
            groupId: null, // 删除流程时，清空分组信息
        })
        await instance.save()
        ctx.ok()
    },

    /**
     * 保存流程模型
     * @param ctx
     * @param next
     */
    'post /app-process-def': async function (ctx, next) {
        const body = ctx.request.body
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const model = await processService.saveProcessDef(ctx.clientAppId, body)
        ctx.ok(model.dataValues)
    },

    /**
     * 查询流程模型
     * @param ctx
     * @param next
     */
    'get /app-process-def/models': async function (ctx, next) {
        const { order } = QueryParser.parseFilter(ctx.request.query)
        const list = await ClModel.findAll({
            where: {
                withProcess: true,
                appId: ctx.clientAppId,
            },
            order,
        })
        ctx.ok(list)
    },

    /**
     * 获取流程定义（流程编辑器用）
     * @param ctx
     * @param next
     * @returns {Promise<any>}
     */
    'get /app-process-def/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const model = await AppProcessDef.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.ok(model.dataValues)
    },

    'get /app-process-def/:processDefinitionId/xml': async (ctx, next) => {
        const processDefinitionId = ctx.getParam('processDefinitionId')
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        const diagramXml = await camundaService.getProcessDefinitionXml(
            processDefinitionId
        )
        ctx.ok(diagramXml)
    },

    /**
     * 渲染流程表单
     * @param ctx
     * @param next
     * @returns {Promise<void>}
     */
    'get /app-process-def/schema/render/:processDefinitionId': async (
        ctx,
        next
    ) => {
        const mode = ctx.getParam('mode')
        const processDefinitionId = ctx.getParam('processDefinitionId')
        const taskDefinitionKey = ctx.getParam('taskDefinitionKey') // node_909640246334
        const processInstanceId = ctx.getParam('processInstanceId')
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const schema = await processService.getProcessFormSchema({
            processDefinitionId,
            mode,
            taskDefinitionKey,
            processInstanceId,
        })
        ctx.ok(schema)
    },

    /**
     * 同步流程模型表单（发布wflow流程）
     * @param ctx
     * @param next
     */
    'post /app-process-def/schema/sync/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        await processService.updateProcessModelSchema(id)
        ctx.ok()
    },

    /**
     * 获取流程表单（流程表单编辑器用）
     * @param ctx
     * @param next
     */
    'get /app-process-def/schema/:processDefId': async (ctx, next) => {
        const processDefId = ctx.getParam('processDefId')
        const model = await AppProcessDef.getByPk(processDefId)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        // 获取Amis页面
        const schema = JSON.parse(model.formSchema || '{}')
        ctx.ok(schema)
    },

    /**
     * 更新流程表单（发布wflow流程）
     * @param ctx
     * @param next
     * @returns {Promise<void>}
     */
    'put /app-process-def/schema': async function (ctx, next) {
        ctx.checkRequired('id')
        const { id, schema: formSchema } = ctx.request.body
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        // 更新流程表单重新发布流程，否则会影响正在运行的流程
        await processService.updateProcessFormSchema(id, formSchema)
        ctx.ok()
    },

    /**
     * 发布wflow流程，更新AppProcessDef
     * @param ctx
     * @param next
     * @returns {Promise<void>}
     */
    'post /app-process-def/wflow': async function (ctx, next) {
        ctx.checkRequired('id')
        const body = ctx.request.body
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const updated = await processService.updateProcessDefFromWFlow(body)
        ctx.ok(updated.dataValues)
    },
}
