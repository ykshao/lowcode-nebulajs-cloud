/**
 * Camunda Types
 * @version 7.18.0
 */
namespace CamundaTypes {
    export type ProcessDefinition = {
        id: string
        key: string
        category: string
        description: null
        name: string
        version: number
        resource: string
        deploymentId: string
        diagram: null
        suspended: boolean
        tenantId: string
        versionTag: null
        historyTimeToLive: null
        startableInTasklist: boolean
    }
    export type Deployment = {
        links: Array<unknown>
        id: string
        name: string
        source: string
        deploymentTime: string
        tenantId: null
        deployedProcessDefinitions: {
            [key: string]: ProcessDefinition
        }
    }
    export type TaskBase = {
        id: string
        name: string
        assignee: string
        priority: number
        owner: null
        due: null
        taskDefinitionKey: string
        processDefinitionId: string
        processInstanceId: string
        caseDefinitionId: null
        caseInstanceId: null
        caseExecutionId: null
        tenantId: string
        description: null
        /**
         * 自定义变量
         */
        extraInfo?: {
            summary: string
            startUserName: string
            formModel: string
            formName: string
            definitionName: string
            definitionIcon: string
        }
    }
    export type Task = TaskBase & {
        /**
         * 2023-04-19T07:30:48.143+0000
         */
        created: string
        followUp: null
        lastUpdated: null
        delegationState: null
        executionId: string
        parentTaskId: null
        suspended: boolean
        formKey: null
        camundaFormRef: null
    }
    export type ProcessInstance = {
        links: Array<unknown>
        id: string
        definitionId: string
        businessKey: string
        caseInstanceId: null
        ended: boolean
        suspended: boolean
        tenantId: null
    }
    export type VariableInstance = {
        type: string
        value: any
        valueInfo: any
        id: string
        name: string
        processDefinitionId: string
        processInstanceId: string
        executionId: string
        caseInstanceId: null
        caseExecutionId: null
        taskId: null
        batchId: null
        activityInstanceId: string
        errorMessage: null
        tenantId: string
    }
    export type Variable = {
        type: string
        value: string
        valueInfo: any
    }
    export type HistoryTask = TaskBase & {
        processDefinitionKey: string
        executionId: string
        caseDefinitionKey: null
        activityInstanceId: string
        deleteReason: string
        startTime: string
        endTime: string
        duration: number
        parentTaskId: null
        followUp: null
        removalTime: null
        rootProcessInstanceId: string
    }
    export type HistoryProcessInstance = {
        id: string
        businessKey: string
        processDefinitionId: string
        processDefinitionKey: string
        processDefinitionName: string
        processDefinitionVersion: number
        startTime: string
        endTime: string
        removalTime: null
        durationInMillis: number
        startUserId: null
        startActivityId: string
        deleteReason: null
        rootProcessInstanceId: string
        superProcessInstanceId: null
        superCaseInstanceId: null
        caseInstanceId: null
        tenantId: string
        /**
         * ACTIVE - running process instance
         * SUSPENDED - suspended process instances
         * COMPLETED - completed through normal end event
         * EXTERNALLY_TERMINATED - terminated externally, for instance through REST API
         * INTERNALLY_TERMINATED
         */
        state:
            | 'ACTIVE'
            | 'SUSPENDED'
            | 'COMPLETED'
            | 'EXTERNALLY_TERMINATED'
            | 'INTERNALLY_TERMINATED'
    }
    export type HistoryVariableInstance = {
        type: string
        value: any
        valueInfo: any
        id: string
        name: string
        processDefinitionKey: string
        processDefinitionId: string
        processInstanceId: string
        executionId: string
        activityInstanceId: string
        caseDefinitionKey: null
        caseDefinitionId: null
        caseInstanceId: null
        caseExecutionId: null
        taskId: string
        errorMessage: null
        tenantId: string
        state: string
        createTime: string
        removalTime: null
        rootProcessInstanceId: string
    }
}
