import { CamundaService } from '../services/common/CamundaService'
import { CamundaSysVars, CamundaTaskSysVars } from '../config/constants'
import moment from 'moment'
import Task = CamundaTypes.Task
import ProcessDefinition = CamundaTypes.ProcessDefinition
import HistoryTask = CamundaTypes.HistoryTask
import { AppProcessDef } from '../models/AppProcessDef'
import { MessageService } from '../services/app/MessageService'
import { ProcessService } from '../services/ProcessService'
import { ClModel } from '../models/ClModel'

export class CamundaTaskListener {
    static taskTimer
    static interval = 10 * 1000
    static listening = false

    constructor() {}

    static listenUnHandledTask(
        handler: (
            task: HistoryTask & { event: string; variableId: string }
        ) => void
    ) {
        if (this.listening) {
            nebula.logger.info('camunda task listening is already running.')
            return
        }
        this.listening = true
        this.taskTimer = setInterval(async () => {
            const tasks = await CamundaService.listAllUnHandledHistoryTasks()
            nebula.logger.debug(
                'Detected unhandled process tasks: %o',
                tasks.length
            )
            for (const task of tasks) {
                try {
                    nebula.logger.info(
                        'Handle camunda task {event:%s, tenantId:%s, id:%s, name:%s, assignee:%s,}',
                        task.event,
                        task.tenantId,
                        task.id,
                        task.name,
                        task.assignee
                    )
                    // 任务回调
                    await handler(task)
                } catch (e) {
                    nebula.logger.error('Handle camunda task error: %o', e)
                }
            }

            // 已完成流程处理
            tasks.length > 0 && (await this.processInstanceHandler(tasks))
        }, this.interval)
    }

    /**
     * 处理已完成的流程
     * @param tasks
     */
    static async processInstanceHandler(tasks: HistoryTask[]) {
        const processInstanceIds = new Set<string>(
            tasks.map((t) => t.processInstanceId)
        )
        const processInstances =
            await CamundaService.listFinishedProcessInstances({
                processInstanceIds: Array.from(processInstanceIds),
            })
        for (const process of processInstances) {
            const processDef = await AppProcessDef.getByUniqueKey(
                'camundaProcessId',
                process.processDefinitionId
            )
            nebula.logger.info(
                'Handle finished process instance {tenantId:%s, processInstanceId:%s, formModel:%s, businessKey:%s}',
                process.tenantId,
                process.id,
                processDef.formModel,
                process.businessKey
            )

            const { appId, envs = '', formModel } = processDef

            // 向租户应用所有环境发送流程完成消息
            for (const env of envs.split(',')) {
                // 向租户应用发送消息，租户收到消息后做一些处理
                const eventName =
                    process.state === 'COMPLETED'
                        ? 'ProcessInstanceCompleted'
                        : 'ProcessInstanceTerminated'
                MessageService.sendClientMessage(eventName, appId, env, process)
            }

            // 流程完成时，向租户应用发送表单模型更新状态消息
            if (formModel && process.state === 'COMPLETED') {
                const model = await ClModel.findOne({
                    where: {
                        name: formModel,
                        appId,
                    },
                    attributes: ['name', 'processStatusField'],
                })
                for (const env of envs.split(',')) {
                    ProcessService.sendProcessFormUpdateMessage(appId, env, {
                        formModel: formModel,
                        businessKey: process.businessKey,
                        props: {
                            [model.processStatusField]: '2', //流程已完成（COMPLETED）
                        },
                    })
                }
            }
        }
    }

    static cancelListenNewTask() {
        if (this.taskTimer) {
            clearInterval(this.taskTimer)
            this.taskTimer = null
            this.listening = false
        }
    }
}
