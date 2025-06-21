import ejs from 'ejs'
import { CamundaService } from '../../services/common/CamundaService'
import { NebulaBizError, QueryParser } from 'nebulajs-core'
import sequelize, { Op } from 'sequelize'
import { ProcessService } from '../../services/ProcessService'
import moment from 'moment'
import { FileService } from '../../services/app/FileService'
import {
    CamundaSysVarPrefix,
    CamundaSysVars,
    Constants,
    DataStatus,
    Websocket,
} from '../../config/constants'
import { ApplicationErrors, ProcessErrors } from '../../config/errors'
import { UserService } from '../../services/app/UserService'
import { MessageService } from '../../services/app/MessageService'
import { CommonUtils } from 'nebulajs-core/lib/utils'
import { AppProcessDef } from '../../models/AppProcessDef'
import { AppUser } from '../../models/AppUser'
import { AppRole } from '../../models/AppRole'

export = {
    /**
     * 待我处理列表
     * @param ctx
     * @param next
     */
    'get /app-process/todo-list': async function (ctx, next) {
        const { page = 1, size = 20 } = QueryParser.parseFilter(
            ctx.request.query
        )
        const offset = (page - 1) * size
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const { login } = ctx.state.user
        const userModel = await UserService.getUserByLoginAndAppId(
            ctx.clientAppId,
            login
        )
        const list: Array<CamundaTypes.TaskBase> =
            await camundaService.listUserTasks({
                assignee: login,
                candidateUser: login,
                candidateGroups: userModel.roles.map((r) => r.code),
                maxResults: size,
                firstResult: offset < 0 ? 0 : offset,
                sortOrder: 'desc',
                sortBy: 'created',
            })
        const taskList = await processService.fetchTaskListExtraInfo(list)
        const { count } = await camundaService.countTasks({
            assignee: login,
            candidateUser: login,
            candidateGroups: userModel.roles.map((r) => r.code),
        })
        ctx.set('X-Total-Count', count)
        ctx.ok(taskList)
    },

    'get /app-process/done-list': async function (ctx, next) {
        const { page = 1, size = 20 } = QueryParser.parseFilter(
            ctx.request.query
        )
        const offset = (page - 1) * size
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const { login } = ctx.state.user
        const list: Array<CamundaTypes.TaskBase> =
            await camundaService.listHistoryTasks({
                assignee: login,
                finished: true, // 已办
                maxResults: size,
                firstResult: offset < 0 ? 0 : offset,
                sortOrder: 'desc',
                sortBy: 'endTime',
            })
        const taskList = await processService.fetchTaskListExtraInfo(list)
        const { count } = await camundaService.countHistoryTasks({
            assignee: login,
            finished: true, // 已办
        })
        ctx.set('X-Total-Count', count)
        ctx.ok(taskList)
    },

    'get /app-process/mine-list': async function (ctx, next) {
        const { page = 1, size = 20 } = QueryParser.parseFilter(
            ctx.request.query
        )
        const offset = (page - 1) * size
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const { login } = ctx.state.user
        const list = await camundaService.listHistoryProcessInstances({
            maxResults: size,
            firstResult: offset < 0 ? 0 : offset,
            sortOrder: 'desc',
            sortBy: 'startTime',
            startUserId: login,
        })
        const extraInfoMap = await processService.getProcessInstanceExtraInfo(
            list.map((p) => p.id)
        )
        const processList = list.map((p) => {
            const extraInfo = extraInfoMap.get(p.id)?.value
            return {
                ...p,
                extraInfo,
            }
        })
        const { count } = await camundaService.countHistoryProcessInstances({
            startUserId: login,
        })
        ctx.set('X-Total-Count', count)
        ctx.ok(processList)
    },

    /**
     * 自定义表单用
     * @param ctx
     * @param next
     * @returns {Promise<void>}
     */
    'get /app-process/:processInstanceId/data': async function (ctx, next) {
        const processInstanceId = ctx.getParam('processInstanceId')
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const processData = await processService.getProcessFormData(
            processInstanceId
        )
        ctx.ok(processData)
    },

    'delete /app-process/:processInstanceId': async function (ctx, next) {
        const processInstanceId = ctx.getParam('processInstanceId')
        // TODO 删除有安全问题，一个应用可删另一个应用
        await CamundaService.deleteHistoryProcessInstanceById(processInstanceId)
        ctx.ok()
    },

    'get /app-process/comments': async function (ctx, next) {
        const processInstanceId = ctx.getParam('processInstanceId')
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        let processInstance: CamundaTypes.HistoryProcessInstance
        if (processInstanceId) {
            // 通过processInstanceId查询流程实例
            processInstance =
                await CamundaService.getHistoryProcessInstanceById(
                    processInstanceId
                )
        } else {
            // 通过formModel、businessKey查询流程实例
            const businessKey = ctx.getParam('businessKey')
            const formModel = ctx.getParam('formModel')
            const processDef = await AppProcessDef.findOne({
                where: {
                    formModel,
                    appId: ctx.clientAppId,
                },
                order: [['createdAt', 'desc']],
            })
            processInstance =
                await camundaService.getHistoryProcessInstanceByDefKeyAndBizKey(
                    processDef.camundaProcessKey,
                    businessKey
                )
        }

        if (!processInstance) {
            throw new NebulaBizError(ProcessErrors.ProcessInstanceNotFound)
        }

        const comments = await processService.listAllFinishedComments(
            processInstance.id
        )
        ctx.ok(comments)
    },

    // 'post /app-process/task/:taskId/comment': async function (ctx, next) {
    //     const taskId = ctx.getParam('taskId')
    //     const { message } = ctx.request.body
    //     const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
    //     await camundaService.createTaskComment(taskId, message)
    //     ctx.ok()
    // },

    'get /app-process/candidates': async (ctx, next) => {
        ctx.checkRequired(['formModel'])
        const formModel = ctx.getParam('formModel')
        const nodeId = ctx.getParam('nodeId') || 'root'
        const processDef = await AppProcessDef.findOne({
            where: {
                formModel,
                appId: ctx.clientAppId,
                status: DataStatus.ENABLED,
            },
            order: [['createdAt', 'desc']],
        })
        const processJsonSchema = JSON.parse(processDef.processJson || '{}')
        const wfNode = ProcessService.getWFlowNode(processJsonSchema, nodeId)
        const {
            mode,
            assignedType,
            role = [],
            assignedUser = [],
        } = wfNode?.children?.props
        if (
            assignedType === 'ROLE' &&
            (mode === 'SELECT_ONE' || mode === 'SELECT_MULTIPLE')
        ) {
            const candidates = (
                await AppUser.findAll({
                    where: {
                        appId: ctx.clientAppId,
                    },
                    include: [
                        {
                            model: AppRole,
                            as: 'roles',
                            attributes: ['id', 'code', 'name'],
                            where: {
                                code: {
                                    [Op.in]: role.map((r) => r.id),
                                },
                            },
                        },
                    ],
                })
            ).map((u) => {
                const { id, name, login } = u
                return {
                    id,
                    name,
                    login,
                }
            })
            ctx.ok({ mode, candidates, assignedType })
        } else if (assignedType === 'ASSIGN_USER') {
            ctx.ok({ mode, candidates: assignedUser, assignedType })
        } else {
            const candidates = []
            ctx.ok({ mode, candidates, assignedType })
        }
    },

    /**
     * 待办、已办、我发起的详情
     * @param ctx
     * @param next
     */
    'get /app-process/info': async function (ctx, next) {
        const processInstanceId = ctx.getParam('processInstanceId')
        const taskId = ctx.getParam('taskId')
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        let processInstance: CamundaTypes.HistoryProcessInstance
        if (processInstanceId) {
            // 通过processInstanceId查询流程实例
            processInstance =
                await CamundaService.getHistoryProcessInstanceById(
                    processInstanceId
                )
        } else {
            // 通过formModel、businessKey查询流程实例
            const businessKey = ctx.getParam('businessKey')
            const formModel = ctx.getParam('formModel')
            const processDef = await AppProcessDef.findOne({
                where: {
                    formModel,
                    appId: ctx.clientAppId,
                },
                order: [['createdAt', 'desc']],
            })
            processInstance =
                await camundaService.getHistoryProcessInstanceByDefKeyAndBizKey(
                    processDef.camundaProcessKey,
                    businessKey
                )
        }

        if (!processInstance) {
            throw new NebulaBizError(ProcessErrors.ProcessInstanceNotFound)
        }

        // 查询流程意见
        const comments = await processService.listAllFinishedComments(
            processInstance.id
        )
        const result = {
            ...processInstance,
            processInstanceId: processInstance.id,
            task: undefined,
            comments,
        }

        if (taskId) {
            const { task, flowNode } = await processService.getTaskDetail(
                taskId
            )

            // 获取下一流程节点
            const nextNode = flowNode.children
            const { type, props = {} } = nextNode
            const {
                assignedType,
                role = [],
                formUser,
                assignedUser,
                mode, //SELECT_ONE
            } = props

            // 下一流程节点是审批节点而且是角色指定
            let selectUserMode = ''
            let selectUserRoles = role.map((r) => r.id).join(',')
            if (type === 'APPROVAL' && assignedType === 'ROLE') {
                selectUserMode = mode
                if (mode === 'SELECT_ONE') {
                } else if (mode === 'SELECT_MULTIPLE') {
                }
            }
            result.task = {
                ...task,
                selectUserMode,
                selectUserRoles,
            }
        }
        ctx.ok(result)
    },

    /**
     * 认领任务
     * @param ctx
     * @param next
     */
    'post /app-process/task/:taskId/claim': async function (ctx, next) {
        const taskId = ctx.getParam('taskId')
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        const { login } = ctx.state.user
        await camundaService.claimTask(taskId, login)
        ctx.ok()
    },

    /**
     * 提交任务、完成任务（同意、驳回）
     * @param ctx
     * @param next
     */
    'post /app-process/task/:taskId/submit': async function (ctx, next) {
        ctx.checkRequired(['flag']) // 同意，驳回
        const taskId = ctx.getParam('taskId')
        const assignees = ctx.getParam('assignees') //可多选，逗号分割
        const selectUserMode = ctx.getParam('selectUserMode')
        const processService = new ProcessService(ctx.clientApp.camundaTenantId)
        const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
        const { login } = ctx.state.user
        let { flag, message, attachment } = ctx.request.body

        if (
            (selectUserMode === 'SELECT_MULTIPLE' ||
                selectUserMode === 'SELECT_ONE') &&
            !assignees
        ) {
            // 选人模式下，assignees为空
            return ctx.bizError(ProcessErrors.ProcessAssigneesCannotBeNull)
        }

        // 当前用户
        const currUser = await UserService.getUserByLoginAndAppId(
            ctx.clientAppId,
            login
        )

        const task = await camundaService.getTask(taskId)
        const processDef = await AppProcessDef.getByUniqueKey(
            'camundaProcessId',
            task.processDefinitionId
        )

        // 归档附件
        if (attachment) {
            const fileService = new FileService(ctx.clientApp.code)
            const files = await fileService.archiveFiles([attachment])
            attachment = files[0]
        }

        const checkFlag = CommonUtils.parseBoolean(flag)
        if (checkFlag) {
            // 获取强制更新变量
            const modelProps = {}
            const updateVariables = await camundaService.getTaskFormVariables(
                taskId
            )

            // 此处会包含启动流程时设置的变量
            Object.keys(updateVariables)
                .filter((name) => !name.startsWith(CamundaSysVarPrefix))
                .forEach((name) => {
                    // TODO ejs.render(aaa)
                    modelProps[name] = updateVariables[name].value
                })

            // 提交任务
            await processService.submitTask(task, {
                comment: message,
                attachment,
                userName: currUser.dataValues.name,
                assigneeList: assignees?.split(','),
                multipleAssignee: selectUserMode === 'SELECT_MULTIPLE',
            })

            // 给应用发送强制更新属性消息
            const formModel = processDef.formModel
            if (formModel && Object.keys(modelProps).length > 0) {
                const { businessKey } =
                    await CamundaService.getHistoryProcessInstanceById(
                        task.processInstanceId
                    )
                ProcessService.sendProcessFormUpdateMessage(
                    ctx.clientAppId,
                    ctx.clientEnv,
                    {
                        formModel,
                        businessKey,
                        props: modelProps,
                    }
                )
            }
        } else {
            // 驳回
            await processService.rejectTask(task, {
                comment: message,
                attachment,
                userName: currUser.dataValues.name,
            })
        }

        ctx.ok()
    },
    // 'get /app-process/:processInstanceId/tasks': async (ctx, next) => {
    //     const processInstanceId = ctx.getParam('processInstanceId')
    //     const camundaService = new CamundaService(ctx.clientApp.camundaTenantId)
    //     const taskList: Array<CamundaTypes.TaskBase> =
    //         await camundaService.listHistoryTasks({
    //             processInstanceId: processInstanceId,
    //             finished: true, // 已办
    //         })
    //     ctx.ok(taskList)
    // },
    'post /app-process/task/delegate': async function (ctx, next) {},
    'post /app-process/task/complete': async function (ctx, next) {},
}
