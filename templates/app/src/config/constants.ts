export const Constants = {
    ROLE_ADMIN: 'ROLE_ADMIN',
}

export const AccessConfig = {
    whitePathList: [
        'get ^/login',
        'post ^/auth/login',
        'get ^/oauth/callback/cas',
        'get ^/swagger/v2/api-docs',
    ],
}

export const ProcessStatus = {
    SAVED: '0',
    SUBMITTED: '1',
    COMPLETED: '2',
}

export const SocketEvent = {
    // 表单更新
    ProcessFormUpdate: 'ProcessFormUpdate',

    // 任务创建
    ProcessTaskCreated: 'ProcessTaskCreated',

    // 任务完成
    ProcessTaskCompleted: 'ProcessTaskCompleted',

    // 任务取消
    ProcessTaskDeleted: 'ProcessTaskDeleted',

    // 流程结束
    ProcessInstanceCompleted: 'ProcessInstanceCompleted',

    // 流程终止
    ProcessInstanceTerminated: 'ProcessInstanceTerminated',
}

export const CamundaTaskEvents = {
    Create: 'create',
    Complete: 'complete',
    Delete: 'delete',
    // Timeout: 'timeout',
}

export const UserMessageTypes = {
    COMMON_MESSAGE: 'COMMON_MESSAGE', // 一般消息
    PROCESS_TASK_TODO: 'PROCESS_TASK_TODO', // 待办
    PROCESS_TASK_DONE: 'PROCESS_TASK_DONE', // 待办完成
}
