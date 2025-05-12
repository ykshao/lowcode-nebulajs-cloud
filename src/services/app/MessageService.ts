import {
    Cache,
    CamundaTaskEvents,
    UserMessageTypes,
    Websocket,
} from '../../config/constants'
import { CamundaService } from '../common/CamundaService'
import { ClApplication } from '../../models/ClApplication'
import { AppMessage } from '../../models/AppMessage'
import { AppUser } from '../../models/AppUser'

export class MessageService {
    static async sendMessage(appId, message) {}
    static async sendSmsMessage() {}

    static async sendAppUserTaskMessage(
        appId: string,
        task: CamundaTypes.HistoryTask,
        processDefinition: CamundaTypes.ProcessDefinition,
        event: string
    ) {
        if (!task.assignee) {
            return
        }
        const user = await AppUser.findOne({
            where: {
                appId,
                login: task.assignee,
            },
        })
        if (!user) {
            nebula.logger.warn(
                '未找到相关用户：%s，无法发送待办消息。',
                task.assignee
            )
        }
        const title = '流程消息'
        const extra = {
            taskId: task.id,
            processInstanceId: task.processInstanceId,
        }
        let type = ''
        let content = ''
        if (event === CamundaTaskEvents.Create) {
            type = UserMessageTypes.PROCESS_TASK_TODO
            content = `您有新的待办需要处理，流程名称【${processDefinition.name}】，节点名称【${task.name}】。`
        } else if (event === CamundaTaskEvents.Complete) {
            type = UserMessageTypes.PROCESS_TASK_DONE
            content = `您的待办已处理完成，流程名称【${processDefinition.name}】，节点名称【${task.name}】。`
        } else if (event === CamundaTaskEvents.Delete) {
            type = UserMessageTypes.COMMON_MESSAGE
            content = `您的待办已被撤消，流程名称【${processDefinition.name}】，节点名称【${task.name}】。`
        } else {
            type = UserMessageTypes.COMMON_MESSAGE
            content = `未知操作，流程名称【${processDefinition.name}】，节点名称【${task.name}】。`
        }

        await AppMessage.create({
            login: task.assignee,
            mobile: user.mobile,
            name: user.name,
            type,
            title,
            content,
            extra: JSON.stringify(extra),
            read: false,
            link: `/system/process-detail?processId=${task.processInstanceId}&taskId=${task.id}`,
            appId,
            createdBy: 'system',
            updatedBy: 'system',
        })

        // 删除消息缓存
        const key = Cache.getAppUserMessageCountKey(appId, task.assignee)
        await nebula.redis.del(key)
    }

    // /**
    //  *
    //  * @param task {{id:string,name:string,assignee:string,processDefinitionId:string,tenantId:string}}
    //  * @return {Promise<void>}
    //  */
    // static async sendTaskFinishClientMessage(task, env) {
    //     const appModel = await ClApplication.getByUniqueKey(
    //         'code',
    //         task.tenantId
    //     )
    //     const processDefinition = await CamundaService.getProcessDefinition(
    //         task.processDefinitionId
    //     )
    //     await MessageService.sendClientMessage(
    //         'ProcessTaskFinished',
    //         appModel.id,
    //         env,
    //         {
    //             definition: processDefinition,
    //             ...task,
    //         }
    //     )
    // }

    static isClientOnline(appId, clientEnv) {
        const socketKey = Websocket.getAppSocketKey(appId, clientEnv)
        return nebula.socketMap.get(socketKey)
    }

    /**
     * 发送租户应用流程消息
     */
    static sendClientProcessMessage(
        processEvent: string,
        appId: string,
        clientEnv: string,
        data?
    ) {
        let clientEvent = ''
        if (processEvent === CamundaTaskEvents.Create) {
            clientEvent = 'ProcessTaskCreated'
        } else if (processEvent === CamundaTaskEvents.Complete) {
            clientEvent = 'ProcessTaskCompleted'
        } else if (processEvent === CamundaTaskEvents.Delete) {
            clientEvent = 'ProcessTaskDeleted'
        }
        this.sendClientMessage(clientEvent, appId, clientEnv, data)
    }

    static sendClientMessage(
        eventName: string,
        appId: string,
        clientEnv: string,
        data?
    ) {
        nebula.logger.info(
            `发送客户端应用消息 event: %s, appId: %s, env: %s, data: %o`,
            eventName,
            appId,
            clientEnv,
            data
        )
        const socketKey = Websocket.getAppSocketKey(appId, clientEnv)
        const socket = nebula.socketMap.get(socketKey)
        if (socket) {
            socket.emit(eventName, data)
        } else {
            nebula.logger.warn(
                '发送消息失败  appId: %s, env: %s',
                appId,
                clientEnv
            )
        }
    }
}
