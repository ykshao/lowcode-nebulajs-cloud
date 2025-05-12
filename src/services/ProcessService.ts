import { CamundaService } from './common/CamundaService'
import { WFlowBuilder } from '../utils/wflow-builder'
import { NebulaBizError, NebulaErrors } from 'nebulajs-core'
import { ApplicationErrors, ProcessErrors } from '../config/errors'
import decamelize from 'decamelize'
import moment from 'moment'
import randomstring from 'randomstring'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import {
    AuditModelProps,
    CamundaSysVarPrefix,
    CamundaSysVars,
    Constants,
    DataStatus,
    Websocket,
} from '../config/constants'
import { AmisService } from './common/AmisService'
import { ModelService } from './ModelService'
import { AppProcessDef } from '../models/AppProcessDef'
import { ClPage } from '../models/ClPage'
import { ClApplication } from '../models/ClApplication'
import { Op } from 'sequelize'
import { PageService } from './PageService'
import { ClModel } from '../models/ClModel'

export class ProcessService {
    camundaService: CamundaService

    constructor(camundaTenantId: string) {
        this.camundaService = new CamundaService(camundaTenantId)
    }

    async getTaskDetail(taskId) {
        // 完成以及未完成的任务都可以查到
        const task = await this.camundaService.getHistoryTask(taskId)
        const { processDefinitionId, taskDefinitionKey } = task
        const model = await AppProcessDef.getByUniqueKey(
            'camundaProcessId',
            processDefinitionId
        )
        if (!model) {
            throw new NebulaBizError(ProcessErrors.ProcessDefNotFound)
        }

        // 获取流程JSON
        const processJsonSchema = JSON.parse(
            model.dataValues.processJson || '{}'
        )
        const wflowNode = ProcessService.getWFlowNode(
            processJsonSchema,
            taskDefinitionKey
        )
        return {
            task,
            flowNode: wflowNode,
        }
    }

    // async getTaskDefinitionInfo(processJson:string ='{}', taskDefinitionKey){
    //     // 获取流程JSON
    //     const processJsonSchema = JSON.parse(processJson)
    //     const wflowNode = this.getWFlowNode(
    //         processJsonSchema,
    //         taskDefinitionKey
    //     )
    //     const nextNode = wflowNode.children
    //     const {
    //         assignedType,
    //         role = [],
    //         formUser,
    //         assignedUser,
    //     } = nextNode.props || {}
    //     nodeInfo = {
    //         nextNode: {
    //             assignedType,
    //             roles: role.map((r) => r.id).join(','),
    //             formUser,
    //             assignedUser,
    //         },
    //     }
    // }

    /**
     * 获取流程额外信息
     * @param processInstanceIds
     */
    async getProcessInstanceExtraInfo(processInstanceIds: string[]) {
        const processExtraInfoMap = new Map<
            string,
            CamundaTypes.HistoryVariableInstance
        >()
        const processVars = await CamundaService.listHistoryVars({
            variableNameLike: `${CamundaSysVars.ExtraInfo}`,
            processInstanceIdIn: processInstanceIds,
        })
        processVars.forEach((hv) => {
            processExtraInfoMap.set(hv.processInstanceId, hv)
        })
        return processExtraInfoMap
    }

    /**
     * 获取流程任务额外信息
     * @param taskList
     */
    async fetchTaskListExtraInfo(taskList: CamundaTypes.TaskBase[]) {
        const extraInfoMap = await this.getProcessInstanceExtraInfo(
            taskList.map((t) => t.processInstanceId)
        )

        // 兼容老数据，老流程数据没有extraInfo，需要从流程定义中获取信息
        const processDefIds = new Set<string>(
            taskList
                .filter((t) => !extraInfoMap.has(t.processInstanceId))
                .map((t) => t.processDefinitionId)
        )
        const processDefMap = new Map<string, AppProcessDef>()
        const processDefs = await AppProcessDef.findAll({
            where: {
                camundaProcessId: {
                    [Op.in]: Array.from(processDefIds),
                },
            },
            attributes: {
                exclude: [
                    'formSchema',
                    'processJson',
                    'settings',
                    ...AuditModelProps,
                ],
            },
        })
        processDefs.forEach((def) => {
            processDefMap.set(def.camundaProcessId, def)
        })
        return taskList.map((t) => {
            const extraInfo = extraInfoMap.get(t.processInstanceId)?.value
            const processDef = processDefMap.get(t.processDefinitionId)
            return {
                ...t,
                extraInfo: {
                    definitionIcon: extraInfo?.definitionIcon,
                    definitionName:
                        extraInfo?.definitionName || processDef?.name,
                    formName: extraInfo?.formName || processDef?.formName,
                    formModel: extraInfo?.formModel || processDef?.formModel,
                    summary: extraInfo?.summary,
                    startUserName: extraInfo?.startUserName,
                },
            }
        })
    }

    /**
     * 根据模型名称从CURD页中查找流程表单
     * @param appId
     * @param formModel
     * @returns {Promise<string>}
     */
    static async getFormSchemaFromModelPage(appId, formModel) {
        const url = `/${decamelize(formModel, { separator: '-' })}`
        const pageModel = await ClPage.findOne({
            where: {
                appId,
                url,
            },
        })
        if (!pageModel) {
            throw new NebulaBizError(ProcessErrors.ProcessModelPageNotFound)
        }
        const appModel = await ClApplication.getByPk(pageModel.appId)
        const schemaFilePath = PageService.getSchemaPath(pageModel, appModel)
        const schemaText = fs.readFileSync(schemaFilePath).toString()
        const schema = JSON.parse(schemaText)
        const forms = AmisService.findElementsByTypes(schema, ['form']).filter(
            (f) =>
                f.api?.method === 'post' &&
                (f.api?.url === `rest${url}` || f.api?.url === `/rest${url}`)
        )
        if (!forms[0]) {
            throw new NebulaBizError(ProcessErrors.ProcessModelPageFormNotFound)
        }
        return forms[0]
    }

    /**
     * 创建流程定义
     *  1. 设置表单固定属性
     *  2. 包装Page节点
     * @param appId
     * @param body
     */
    async saveProcessDef(appId: string, body: AppProcessDef) {
        // 绑定模型
        if (body.formModel) {
            const formModel = await ClModel.findOne({
                where: {
                    name: body.formModel,
                    appId,
                },
            })
            if (!formModel) {
                throw new NebulaBizError(ProcessErrors.ProcessModelNotFound)
            }
            const formObject = await ProcessService.getFormSchemaFromModelPage(
                appId,
                body.formModel
            )
            const dictKeys = await ModelService.getModelDictKeys(
                appId,
                body.formModel
            )
            body.formName = formModel.comment
            body.formSchema = JSON.stringify(
                ProcessService.wrapProcessForm(formObject, dictKeys)
            )
        }
        let processModel: AppProcessDef = null
        if (body.id) {
            // 更新
            processModel = await AppProcessDef.getByPk(body.id)
            if (!processModel) {
                throw new NebulaBizError(
                    NebulaErrors.BadRequestErrors.DataNotFound
                )
            }
            processModel.set({
                ...body,
                appId,
                status: DataStatus.ENABLED,
            })
        } else {
            // 新增
            processModel = AppProcessDef.build({
                ...body,
                appId,
                status: DataStatus.ENABLED,
                version: '0', // 未发布到camunda时的版本
                camundaProcessKey: `nebula_${randomstring.generate(16)}`,
            })
        }
        processModel = await processModel.save()
        return processModel
    }

    /**
     * 获取流程表单Schema
     *   1. 分为只读模式和可编辑模式（edit/view）
     *   2. 针对是否绑定模型设置数据初始化地址
     */
    async getProcessFormSchema({
        processDefinitionId,
        mode,
        processInstanceId,
        taskDefinitionKey,
    }) {
        mode = mode || 'edit'
        const model = await AppProcessDef.getByUniqueKey(
            'camundaProcessId',
            processDefinitionId
        )
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        // 获取Amis页面
        const schema = JSON.parse(model.formSchema || '{}')
        // 获取Amis表单
        const formObject = AmisService.findElementsByTypes(schema, ['form'])[0]
        if (!formObject) {
            throw new NebulaBizError(ProcessErrors.ProcessFormNotFound)
        }
        nebula.logger.info('获取表单对象：%o', formObject)

        // 获取流程JSON
        const processJsonSchema = JSON.parse(model.processJson || '{}')
        const wfNode = ProcessService.getWFlowNode(
            processJsonSchema,
            taskDefinitionKey
        )
        nebula.logger.info('获取流程节点：%o', wfNode)

        // 获取表单权限
        const permMap = {}
        const { formPerms = [] } = wfNode?.props || {}
        formPerms
            .filter((p) => p.id)
            .forEach((p) => {
                permMap[p.id] = p
            })
        const formItems = AmisService.findAmisFormElements(formObject)
        for (const item of formItems) {
            const { name } = item
            // 默认根据模式走
            item.disabled = mode === 'view'
            item.hidden = false
            // R E H 覆盖模式
            if (permMap[name]?.perm === 'H') {
                item.hidden = true
            } else {
                if (permMap[name]?.perm === 'R') {
                    item.disabled = true
                    item.disabledOn = undefined // 去掉按条件disabled
                } else if (permMap[name]?.perm === 'E') {
                    item.disabled = false
                }
            }
        }

        // 设置form初始化Api
        // 绑定模型
        if (model.dataValues.formModel) {
            const result = await CamundaService.getHistoryProcessInstanceById(
                processInstanceId
            )
            this.setProcessFormProps(formObject, model, result.businessKey)
        } else {
            this.setProcessFormProps(formObject, model)
        }
        return schema
    }

    static wrapProcessForm(formObject, dictKeys) {
        return {
            type: 'page',
            pullRefresh: {
                disabled: true,
            },
            regions: ['body'],
            body: [formObject],
            initApi: {
                url: 'cloud/app/app-dict/search/codes?codes=' + dictKeys,
                method: 'get',
                messages: {},
            },
        }
    }
    setProcessFormProps(formObject, defModel, businessId?) {
        // 设置固定formId
        formObject.id = 'nebula:custom_process_form'
        // 可以访问页面上级数据
        formObject.canAccessSuperData = false
        // 表单是否用Panel包裹
        formObject.wrapWithPanel = true

        formObject.actions = []

        const formModel = defModel.dataValues.formModel
        if (formModel) {
            // 业务表单
            const path = decamelize(formModel, {
                separator: '-',
            })
            formObject.title = defModel.dataValues.formName
            formObject.initApi = {
                url: `rest/${path}/${businessId}`,
                method: 'get',
            }
            formObject.api = {
                url: `rest/${path}`,
                method: 'post',
                dataType: 'json',
                data: {
                    '&': '$$',
                    id: '${id}',
                },
                messages: {
                    success: '',
                },
            }
            formObject.onEvent = {
                submitSucc: {
                    actions: [
                        {
                            actionType: 'broadcast',
                            args: {
                                eventName: 'nebula:business_process_submit',
                            },
                            data: {},
                        },
                    ],
                },
            }
        } else {
            // 自定义表单
            formObject.initApi = {
                url: 'cloud/app/app-process/$processInstanceId/data',
                method: 'get',
            }
            formObject.api = {
                url: 'cloud/app/app-process-def/start?processDefId=$id',
                method: 'post',
                dataType: 'json',
                messages: {
                    success: '提交表单成功',
                },
            }
        }
    }

    /**
     * 获取流程实例中的变量
     * @param processInstanceId
     * @returns {Promise<{}>}
     */
    async getProcessFormData(processInstanceId) {
        const variables = (
            await CamundaService.listHistoryVars({
                processInstanceId: processInstanceId,
            })
        ).filter((v) => !v.name.startsWith(CamundaSysVarPrefix))

        const data = {}
        for (const v of variables) {
            data[v.name] = v.value
        }
        return data
    }

    /**
     * 同步模型中的页面表单到流程表单
     * @param id
     * @return {Promise<void>}
     */
    async updateProcessModelSchema(id) {
        const model = await AppProcessDef.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const { formModel, appId } = model.dataValues
        const formObject = await ProcessService.getFormSchemaFromModelPage(
            appId,
            formModel
        )
        const dictKeys = await ModelService.getModelDictKeys(appId, formModel)
        const formSchema = JSON.stringify(
            ProcessService.wrapProcessForm(formObject, dictKeys)
        )
        // 重新发布wflow流程
        await this.updateProcessDefFromWFlow({
            ...model.dataValues,
            formSchema,
        })
    }

    /**
     * 更新流程表单
     * @param id
     * @param formSchema
     * @return {Promise<void>}
     */
    async updateProcessFormSchema(id, formSchema) {
        const model = await AppProcessDef.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        // 重新发布wflow流程
        await this.updateProcessDefFromWFlow({
            ...model.dataValues,
            formSchema,
        })
    }

    /**
     * 发布wflow流程，更新AppProcessDef
     * @param wflowData
     */
    async updateProcessDefFromWFlow(wflowData) {
        const {
            id,
            name,
            processJson,
            remark,
            settings,
            groupId,
            icon,
            formSchema,
        } = wflowData

        const model = await AppProcessDef.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const deployedProcessDefinition =
            await this.deployCamundaProcessFromWFlow({
                id,
                name,
                processJson: processJson || model.processJson,
                key: model.camundaProcessKey,
            })
        const {
            id: processDefinitionId,
            deploymentId,
            version,
        } = deployedProcessDefinition

        const transaction = await nebula.sequelize.transaction()
        try {
            // 复制一个新的流程定义
            const newModel = AppProcessDef.create(
                {
                    ...model.dataValues,
                    id: undefined,
                    name,
                    processJson: processJson || model.processJson,
                    formSchema: formSchema || model.formSchema,
                    settings: settings || model.settings,
                    remark,
                    groupId,
                    icon,
                    version: version.toString(),
                    camundaProcessKey: model.camundaProcessKey,
                    camundaDeploymentId: deploymentId,
                    camundaProcessId: processDefinitionId,
                    status: DataStatus.ENABLED,
                },
                { transaction }
            )

            // 作废老流程
            await AppProcessDef.update(
                { status: DataStatus.DISABLED },
                {
                    where: {
                        camundaProcessKey: model.camundaProcessKey,
                    },
                    transaction,
                }
            )

            // commit
            await transaction.commit()
            return newModel
        } catch (e) {
            await transaction.rollback()
            throw e
        }
    }

    /**
     * 发布wflow流程到camunda
     * @param wflowData
     */
    async deployCamundaProcessFromWFlow({ id, name, processJson, key }) {
        // const { formModel, formName } = processDefModel
        const builder = new WFlowBuilder({
            id: key, //流程key，此处不能改为冒号，格式必须为xxx_xxx，需要有下划线，否则AutoLayout会报错
            name,
            documentation: '',
            // documentation: JSON.stringify({ formModel, formName }),
        }).loadWFlowData(processJson)
        const xml = await builder.toXml({ layout: true })
        nebula.logger.info('wflow转换bpmn：%s', xml)

        // 发布到camunda
        const deployResult = await this.camundaService.createDeployment({
            name,
            source: xml,
        })
        nebula.logger.info('发布结果：%o', deployResult)

        const { deployedProcessDefinitions } = deployResult
        if (Object.keys(deployedProcessDefinitions).length === 0) {
            throw new NebulaBizError(ProcessErrors.ProcessDeployFailed)
        }
        const deployedProcessDefinition =
            deployedProcessDefinitions[
                Object.keys(deployedProcessDefinitions)[0]
            ]

        return deployedProcessDefinition
    }

    async cancelProcess({
        processDefinitionKey,
        businessKey,
    }: {
        processDefinitionKey: string
        businessKey: string
    }) {
        nebula.logger.info(
            '取消流程：processDefinitionKey:%o businessKey:%s',
            processDefinitionKey,
            businessKey
        )
        const instances = await this.camundaService.listProcessInstances({
            businessKey,
            processDefinitionKey,
            processDefinitionKeyIn: null,
        })

        for (const processInstance of instances) {
            const processInstanceId = processInstance.id
            // 获取活动流程
            const { childActivityInstances } =
                await this.camundaService.listActivityInstances(
                    processInstanceId
                )
            for (const activity of childActivityInstances) {
                // 修改流程
                const modifyResult =
                    await this.camundaService.modifyProcessInstance(
                        processInstanceId,
                        [
                            {
                                type: 'cancel', // 取消当前流程实例
                                activityInstanceId: activity?.id,
                            },
                            // {
                            //     type: 'cancel', // 取消全部节点任务
                            //     activityId: taskDefinitionKey,
                            // },
                        ]
                    )
                nebula.logger.info('取消流程结果：%o', modifyResult)
            }
            // await this.camundaService.deleteProcessInstance(processInstanceId)
        }
    }

    async startProcess({
        processDefId,
        variables,
        startUserId,
        businessKey,
        extraInfo,
    }: {
        processDefId
        variables
        startUserId
        businessKey?
        extraInfo?: {}
    }) {
        const result = await this.camundaService.startProcess({
            processDefinitionId: processDefId,
            variables,
            businessKey,
            startUserId,
            extraInfo,
        })
        return result
    }

    async rejectTask(task, { comment, attachment, userName }) {
        const {
            id: taskId,
            name,
            assignee,
            taskDefinitionKey,
            processInstanceId,
            processDefinitionId,
        } = task
        nebula.logger.info('获取驳回任务：%s %o', taskId, task)

        // 加入本次驳回变量
        const rejectVariables = {}
        rejectVariables[`${CamundaSysVars.Task}:${taskId}`] = {
            value: {
                comment,
                name,
                assignee,
                assigneeName: userName || assignee,
                taskDefinitionKey,
                attachment,
                flag: false,
            },
        }

        // 获取Nebula流程
        const processDef = await AppProcessDef.getByUniqueKey(
            'camundaProcessId',
            processDefinitionId
        )
        const { processJson } = processDef.dataValues
        const previousNodes = ProcessService.getWFlowPreviousNodes(
            JSON.parse(processJson),
            taskDefinitionKey
        ).filter((n) => n.type === 'APPROVAL')
        // nebula.logger.info('获取历史节点：%o', previousNodes)
        const lastNode = previousNodes[previousNodes.length - 1]
        nebula.logger.info('获取上一个历史节点：%o', lastNode)

        // 获取当前活动实例
        const activityInstance =
            await this.camundaService.getInstanceForActivity(
                processInstanceId,
                taskDefinitionKey
            )
        nebula.logger.info('获取当前活动实例：%o', activityInstance)

        // 修改流程
        const modifyResult = await this.camundaService.modifyProcessInstance(
            processInstanceId,
            [
                {
                    type: 'cancel', // 取消当前流程执行实例（后续重新开始）
                    activityInstanceId: activityInstance?.id,
                },
                // {
                //     type: 'cancel', // 取消全部节点任务
                //     activityId: taskDefinitionKey,
                // },
                {
                    type: 'startBeforeActivity', // 重新开始流程实例
                    activityId: lastNode ? lastNode.id : taskDefinitionKey,
                    variables: rejectVariables,
                },
            ]
        )
        nebula.logger.info('更新流程结果：%o', modifyResult)
        await this.camundaService.deleteTask(taskId)
    }

    /**
     * 提交任务
     * @param task
     * @param comment 意见
     * @param attachment 附件
     * @param userName
     * @param assigneeList 下一节点审批人（单人、多人）
     * @param multipleAssignee 是否多人审批
     */
    async submitTask(
        task,
        { comment, attachment, userName, assigneeList = [], multipleAssignee }
    ) {
        const { id: taskId, name, assignee, taskDefinitionKey } = task
        const variables = {}
        nebula.logger.info('获取提交任务：%s %o', taskId, task)

        // 添加审批变量
        await this.camundaService.putTaskLocalVariables(
            taskId,
            CamundaSysVars.Task,
            {
                value: {
                    comment,
                    name,
                    assignee,
                    assigneeName: userName || assignee,
                    taskDefinitionKey,
                    attachment,
                    flag: true,
                },
            }
        )

        if (assigneeList.length > 0) {
            if (multipleAssignee) {
                // 下一节点审批人（多人）
                variables[CamundaSysVars.AssigneeList] = {
                    value: assigneeList, // 集合型变量
                }
            } else {
                // 下一节点审批人（单人）
                variables[CamundaSysVars.Assignee] = {
                    value: assigneeList[0],
                }
            }
        }

        // 审批通过
        nebula.logger.info('提交表单：%s, %o', taskId, variables)
        const submitResult = await this.camundaService.submitTaskForm(
            taskId,
            variables
        )
    }

    async listAllFinishedComments(processInstanceId) {
        const sysVars = await CamundaService.listHistoryVars({
            variableNameLike: `${CamundaSysVars.Task}%`,
            processInstanceId: processInstanceId,
        })

        const tasks = sysVars
            .map((v) => {
                const { processDefinitionId, processInstanceId, taskId } = v
                return {
                    ...v.value,
                    createTime: v.createTime,
                    processDefinitionId,
                    processInstanceId,
                    taskId,
                }
            })
            .sort((a, b) => {
                const diff =
                    moment(a.createTime).toDate().getTime() -
                    moment(b.createTime).toDate().getTime()
                return diff
            })
        return tasks
    }

    static getWFlowPreviousNodes(processSchema, nodeId) {
        const nodeMap = new Map()
        const node = this.getWFlowNode(processSchema, nodeId, (iterNode) => {
            nodeMap.set(iterNode.id, iterNode)
        })
        return this.getWFlowParents(nodeMap, node)
    }

    static getWFlowParents(nodeMap, schema) {
        const { parentId } = schema
        let parents = []
        if (parentId) {
            const parent = nodeMap.get(parentId)
            parents.push(parent)
            parents = parents.concat(this.getWFlowParents(nodeMap, parent))
        }
        return parents
    }

    // getWFlowAllNextNodes(schema, nodeType) {
    //     const { children, branchs = [] } = schema
    //     let nodes = []
    //     if (schema && schema.type === nodeType) {
    //         nodes.push(schema)
    //     }
    //     if (branchs.length > 0) {
    //         for (const branch of branchs) {
    //             const subNodes = this.getWFlowAllNextNodes(branch, nodeType)
    //             nodes = nodes.concat(subNodes)
    //         }
    //     } else if (children && children.id) {
    //         const subNodes = this.getWFlowAllNextNodes(children, nodeType)
    //         nodes = nodes.concat(subNodes)
    //     }
    //     return nodes
    // }

    static getWFlowNode(schema, nodeId, cb?: (node) => void) {
        const { children, branchs = [] } = schema
        cb && cb(schema)
        if (schema.id === nodeId) {
            return schema
        }
        if (branchs.length > 0) {
            for (const branch of branchs) {
                const node = this.getWFlowNode(branch, nodeId, cb)
                if (node) {
                    return node
                }
            }
        } else {
            if (children && children.id) {
                const node = this.getWFlowNode(children, nodeId, cb)
                if (node) {
                    return node
                }
            }
        }
        return null
    }

    static sendProcessFormUpdateMessage(
        appId,
        clientEnv,
        { formModel, businessKey, props }
    ) {
        const socketKey = Websocket.getAppSocketKey(appId, clientEnv)
        // 给应用发送强制更新属性消息
        const socket = nebula.socketMap.get(socketKey)
        if (!socket) {
            throw new NebulaBizError(ApplicationErrors.ApplicationNotConnected)
        }
        socket.emit('ProcessFormUpdate', {
            id: businessKey,
            model: formModel,
            props: props,
        })
    }
}
