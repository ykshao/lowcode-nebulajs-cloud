import { AxiosInstance } from 'axios'
import moment from 'moment'
import { NebulaAxiosRequest, NebulaBizError } from 'nebulajs-core'
import { Client as CamundaClient } from 'nebulajs-camunda-sdk'
import FormData from 'form-data'
import { ProcessErrors } from '../../config/errors'
import {
    CamundaSysVars,
    CamundaTaskEvents,
    CamundaTaskSysVars,
} from '../../config/constants'
import { camunda } from '../../config/env'
import ProcessInstance = CamundaTypes.ProcessInstance

const camundaClient = new CamundaClient(camunda)
camundaClient.initialize()
const tenantApi = camundaClient.resource('tenant')
const processDefApi = camundaClient.resource('process-definition')
const deploymentApi = camundaClient.resource('deployment')
const processInsApi = camundaClient.resource('process-instance')
const variableApi = camundaClient.resource('variable')
const taskApi = camundaClient.resource('task')
const userApi = camundaClient.resource('user')
const historyApi = camundaClient.resource('history')

export class CamundaService {
    tenantId
    tenantApi
    processDefApi
    deploymentApi
    processInsApi
    variableApi
    taskApi
    userApi
    historyApi

    constructor(camundaTenantId: string) {
        // 租户ID不能包含中划线和下划线
        this.tenantId = camundaTenantId
        if (!this.tenantId) {
            throw new Error('tenantId can not be null.')
        }
    }

    static async createTenant({ id, name }) {
        return tenantApi.create({ id, name })
    }

    async deleteProcessDefinition(processDefId) {
        return processDefApi.http.del(`process-definition/${processDefId}`)
    }

    async listProcessDefinitions({
        processDefinitionIds,
    }): Promise<CamundaTypes.ProcessDefinition[]> {
        return processDefApi.http.get('process-definition', {
            data: {
                // latestVersion: true,
                tenantIdIn: this.tenantId,
                // nameLike: name,
                processDefinitionIdIn: processDefinitionIds,
            },
        })
    }

    /**
     * 获取流程定义bpmn xml
     * @param processDefinitionId
     */
    async getProcessDefinitionXml(processDefinitionId: string) {
        const { bpmn20Xml } = await processDefApi.http.get(
            `process-definition/${processDefinitionId}/xml`,
            {}
        )
        return bpmn20Xml
    }

    async listDeployments(): Promise<CamundaTypes.Deployment[]> {
        return deploymentApi.list({
            tenantIdIn: this.tenantId,
        })
    }

    async createDeployment({ name, source }): Promise<CamundaTypes.Deployment> {
        return deploymentApi.create({
            deploymentName: name,
            deploymentSource: 'Nebulajs Cloud',
            files: [{ name: `${name}.bpmn20.xml`, content: source }],
            tenantId: this.tenantId,
        })
    }

    async listProcessInstances({
        businessKey,
        processDefinitionKey,
        processDefinitionKeyIn,
        // processDefinitionId,
        // processInstanceIds,
    }): Promise<CamundaTypes.ProcessInstance[]> {
        return processInsApi.list({
            tenantIdIn: [this.tenantId],
            businessKey,
            processDefinitionKey,
            processDefinitionKeyIn,
            // processDefinitionId,
            // processInstanceIds,
        })
    }

    async deleteProcessInstance(processInstanceId) {
        return processInsApi.http.del(`process-instance/${processInstanceId}`)
    }

    /**
     * 获取某流程ID下所有的分支实例
     * @param processInstanceId
     * @returns {Promise<*>}
     */
    async listActivityInstances(processInstanceId) {
        return processInsApi.http.get(
            `process-instance/${processInstanceId}/activity-instances`
        )
    }

    /**
     * 获取当前节点所在分支的执行实例
     * @param processInstanceId
     * @param activityId
     * @returns {Promise<*|null>}
     */
    async getInstanceForActivity(processInstanceId, activityId) {
        const instance = await this.listActivityInstances(processInstanceId)
        return this.findInstanceByActivityId(instance, activityId)
    }

    async findInstanceByActivityId(processInstance, activityId) {
        const { childActivityInstances, activityId: currActivityId } =
            processInstance
        if (currActivityId === activityId) {
            return processInstance
        }
        for (const childIns of childActivityInstances) {
            const instance = this.findInstanceByActivityId(childIns, activityId)
            if (instance) {
                return instance
            }
        }
        return null
    }

    async modifyProcessInstance(instanceId, instructions: any[]) {
        nebula.logger.info(
            'modify process instance: %o  %o',
            instanceId,
            instructions
        )
        return processInsApi.modify({
            id: instanceId,
            instructions,
            // skipCustomListeners,
            // skipIoMappings
        })
    }

    /**
     * 用最新流程定义启动流程
     * @param processDefinitionId
     * @param variables
     * @param businessKey
     * @param startUserId
     * @param extraInfo
     */
    async startProcess({
        processDefinitionId,
        variables = {},
        businessKey,
        startUserId,
        extraInfo,
    }): Promise<ProcessInstance> {
        nebula.logger.info(
            '启动流程：processDefId:%s  businessKey:%s  startUserId:%s  variables:%o  summary:%s',
            processDefinitionId,
            businessKey,
            startUserId,
            variables
        )

        // 添加发起人变量
        variables[`${CamundaSysVars.StartUser}`] = startUserId

        // 标题、等额外信息
        variables[`${CamundaSysVars.ExtraInfo}`] = extraInfo

        // 转换camunda variables
        const varParams = {}
        for (const key in variables) {
            varParams[key] = {
                value: variables[key],
            }
        }
        return processDefApi.start({
            id: processDefinitionId,
            tenantId: this.tenantId,
            variables: varParams,
            businessKey,
        })
    }

    /**
     * 根据用户ID查询流程实例数量
     * @param startUserId
     * @param variables
     * @returns {Promise<*>}
     */
    async countHistoryProcessInstances({ startUserId, variables = [] }) {
        if (startUserId) {
            variables.push({
                name: CamundaSysVars.StartUser,
                operator: 'eq',
                value: startUserId,
            })
        }
        return historyApi.processInstanceCount({
            tenantIdIn: [this.tenantId],
            variables,
        })
    }

    /**
     * 根据用户ID查询流程实例
     * @param firstResult
     * @param maxResults
     * @param sortOrder
     * @param sortBy
     * @param startUserId
     * @param variables
     * @returns {Promise<*>}
     */
    async listHistoryProcessInstances({
        firstResult,
        maxResults,
        sortOrder,
        sortBy,
        startUserId,
        variables = [],
    }): Promise<CamundaTypes.HistoryProcessInstance[]> {
        if (startUserId) {
            variables.push({
                name: CamundaSysVars.StartUser,
                operator: 'eq',
                value: startUserId,
            })
        }
        return historyApi.processInstance({
            tenantIdIn: [this.tenantId],
            firstResult,
            maxResults,
            sortOrder,
            sortBy,
            variables,
        })
    }

    async listHistoryTasks({
        taskId,
        assignee,
        processInstanceId,
        finished,
        firstResult,
        maxResults,
        sortOrder,
        sortBy,
    }: {
        taskId?
        assignee?
        processInstanceId?
        finished?
        firstResult?
        maxResults?
        sortOrder?
        sortBy?
    }): Promise<CamundaTypes.HistoryTask[]> {
        return historyApi.task({
            tenantIdIn: [this.tenantId],
            taskId,
            taskAssignee: assignee,
            finished,
            processInstanceId,
            firstResult,
            maxResults,
            sortOrder,
            sortBy,
        })
    }

    async countHistoryTasks({
        assignee,
        processInstanceId,
        finished,
    }: {
        assignee?
        processInstanceId?
        finished?
    }) {
        return historyApi.taskCount({
            tenantIdIn: [this.tenantId],
            taskAssignee: assignee,
            finished,
            processInstanceId,
        })
    }

    async deleteTask(taskId) {
        return taskApi.http.del(`task/${taskId}`)
    }

    static async listHistoryVars({
        variableName,
        variableNameLike,
        taskIdIn,
        processInstanceId,
        processInstanceIdIn,
    }: {
        variableName?
        variableNameLike?
        taskIdIn?
        processInstanceId?
        processInstanceIdIn?
    }): Promise<CamundaTypes.HistoryVariableInstance[]> {
        return historyApi.variableInstance({
            variableName,
            variableNameLike,
            taskIdIn,
            processInstanceId,
            processInstanceIdIn,
        })
    }

    async countTasks({
        assignee,
        candidateUser,
        candidateGroups,
    }: {
        assignee
        candidateUser
        candidateGroups: string[]
    }) {
        return taskApi.http.post('task/count', {
            data: {
                tenantIdIn: [this.tenantId],
                orQueries: [
                    {
                        assignee,
                        candidateUser,
                        candidateGroups:
                            candidateGroups.length > 0 ? candidateGroups : null,
                    },
                ],
            },
        })
    }

    async listUserTasks({
        assignee,
        candidateUser,
        candidateGroups = [],
        firstResult,
        maxResults,
        sortOrder,
        sortBy,
    }): Promise<CamundaTypes.Task[]> {
        return taskApi.http.post('task', {
            query: {
                firstResult,
                maxResults,
            },
            data: {
                tenantIdIn: [this.tenantId],
                orQueries: [
                    {
                        assignee,
                        candidateUser,
                        candidateGroups:
                            candidateGroups.length > 0 ? candidateGroups : null,
                    },
                ],
                sorting: [
                    {
                        sortBy,
                        sortOrder,
                    },
                ],
            },
        })
    }

    async putTaskLocalVariables(taskId, varName, data) {
        return taskApi.localVariable({
            id: taskId,
            varId: varName,
            ...data,
        })
    }

    static async getProcessInstance(instanceId) {
        return processInsApi.get(instanceId)
    }

    // 获取流程定义，根据ID不会取到旧版本
    static async getProcessDefinition(
        processDefId
    ): Promise<CamundaTypes.ProcessDefinition> {
        return processDefApi.get(processDefId)
    }

    static async getHistoryProcessInstanceById(
        instanceId
    ): Promise<CamundaTypes.HistoryProcessInstance> {
        return historyApi.http.get(`history/process-instance/${instanceId}`)
    }

    static async deleteHistoryProcessInstanceById(instanceId) {
        return historyApi.http.del(`history/process-instance/${instanceId}`)
    }

    /**
     * 根据业务ID获取最新的流程实例
     * @param processDefinitionKey
     * @param businessKey
     */
    async getHistoryProcessInstanceByDefKeyAndBizKey(
        processDefinitionKey,
        businessKey
    ): Promise<CamundaTypes.HistoryProcessInstance> {
        // camunda 7.18用get方法，post不支持
        const list = await historyApi.http.get(`history/process-instance`, {
            data: {
                processDefinitionKey,
                processInstanceBusinessKey: businessKey,
                sortBy: 'startTime',
                sortOrder: 'desc',
                tenantIdIn: this.tenantId,
            },
        })
        return list[0] || null
    }

    async getTask(taskId): Promise<CamundaTypes.Task> {
        try {
            return taskApi.get(taskId)
        } catch (e) {
            if (e.message.match(/No matching task with id/)) {
                throw new NebulaBizError(ProcessErrors.ProcessTaskNotFound)
            }
            throw e
        }
    }

    /**
     * 完成以及未完成的任务都可以查到
     * @param taskId
     */
    async getHistoryTask(taskId): Promise<CamundaTypes.HistoryTask> {
        const list = await this.listHistoryTasks({ taskId })
        if (list.length === 0) {
            throw new NebulaBizError(ProcessErrors.ProcessTaskNotFound)
        }
        return list[0]
    }

    /**
     * 查询所有已完成的流程
     * @param processInstanceIds
     */
    static async listFinishedProcessInstances({
        processInstanceIds,
    }: {
        processInstanceIds: string[]
    }): Promise<CamundaTypes.HistoryProcessInstance[]> {
        // camunda 7.18用get方法，post不支持
        return await historyApi.http.get(`history/process-instance`, {
            data: {
                processInstanceIds,
                finished: true,
            },
        })
    }

    /**
     * 完成、未完成的任务都可以查到
     */
    static async listAllUnHandledHistoryTasks(): Promise<
        Array<CamundaTypes.HistoryTask & { event: string; variableId: string }>
    > {
        // 先查变量，再查任务
        const instances: CamundaTypes.HistoryVariableInstance[] =
            await historyApi.variableInstance({
                variableNameIn: [
                    CamundaTaskSysVars.NewTaskEvent,
                    CamundaTaskSysVars.HisTaskEvent,
                ],
            })
        const events = Object.keys(CamundaTaskEvents).map(
            (k) => CamundaTaskEvents[k]
        )
        const varList = instances
            .filter((ins) => events.includes(ins.value))
            .sort((a, b) => moment(a.createTime).diff(moment(b.createTime)))
            .map((ins) => {
                return {
                    taskId: ins.taskId,
                    value: ins.value,
                    variableId: ins.id,
                }
            })
        const taskList = []
        for (const ins of varList) {
            const task = (
                await historyApi.task({
                    taskId: ins.taskId,
                })
            )[0]
            taskList.push({
                ...(task || {}),
                event: ins.value,
                variableId: ins.variableId,
            })
        }
        return taskList
    }

    // static async listFinishedTasks({
    //     finishedAfter,
    //     finishedBefore,
    // }): Promise<CamundaTypes.HistoryTask[]> {
    //     return historyApi.task({
    //         finished: true,
    //         finishedAfter,
    //         finishedBefore,
    //         // taskDeleteReason: 'completed', 会有deleted
    //     })
    // }

    static async getTaskLocalVariable(
        taskId,
        varName
    ): Promise<CamundaTypes.Variable> {
        return taskApi.localVariable({
            id: taskId,
            varId: varName,
        })
    }

    static async deleteTaskLocalVariable(taskId, varName) {
        return taskApi.deleteVariable({
            id: taskId,
            varId: varName,
        })
    }

    static async deleteHistoryVariable(variableId: string) {
        return historyApi.http.del(`history/variable-instance/${variableId}`)
    }

    async getTaskFormVariables(taskId) {
        return taskApi.formVariables({ id: taskId })
    }

    async createTaskComment(taskId, message) {
        return taskApi.createComment(taskId, message)
    }

    async submitTaskForm(taskId, variables) {
        return taskApi.submitForm({ id: taskId, variables })
    }

    async completeTask(taskId, variables) {
        return taskApi.complete({ id: taskId, variables })
    }

    async setTaskAssignee(taskId, userId) {
        return taskApi.assignee(taskId, userId, null)
    }

    async claimTask(taskId, userId) {
        return taskApi.claim(taskId, userId, null)
    }

    async unclaimTask(taskId) {
        return taskApi.unclaim(taskId)
    }

    async delegateTask(taskId, userId) {
        return taskApi.delegate(taskId, userId)
    }
}
