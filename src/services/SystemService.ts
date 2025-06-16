import fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'
import { CamundaTaskListener } from '../jobs/camunda-task-listener'
import { CamundaService } from './common/CamundaService'
import { AppProcessDef } from '../models/AppProcessDef'
import { MessageService } from './app/MessageService'

export class SystemService {
    static async isEmptyDatabase() {
        if (nebula.config.database.dialect === 'sqlite') {
            const sql = "select name from sqlite_master where type='table'"
            const [results, metadata] = await nebula.sequelize.query(sql)
            nebula.logger.debug('SQLite tables: %o', results)
            return results.length === 0
        } else if (nebula.config.database.dialect === 'mysql') {
            const results = await nebula.sequelize.query(
                'select table_name as table_name, table_comment as table_comment ' +
                    'from information_schema.tables ' +
                    'where table_schema = :schema and table_name like "cl_%"',
                {
                    raw: true,
                    type: QueryTypes.SELECT,
                    replacements: { schema: nebula.config.database.database },
                }
            )
            return results.length === 0
        }
        return false
    }

    /**
     * 初始化SQLite
     */
    static async initDatabase() {
        const needInitialize = await this.isEmptyDatabase()
        if (needInitialize) {
            nebula.logger.info('初始化数据库开始')
            await nebula.sequelize.sync({ alter: true })
            // 初始化数据
            const sqlFile = fs
                .readFileSync(path.resolve('./res/init.sql'))
                .toString()
                .replace(/\r?\n/g, '\n')
            const sqlCmds = sqlFile
                .split(/;\n/)
                .map((s) => s.trim())
                .filter((s) => s)
            for (const sql of sqlCmds) {
                await nebula.sequelize.query(sql, {
                    logging: console.log,
                    raw: true,
                    type: QueryTypes.RAW,
                })
            }
            nebula.logger.info('初始化数据库成功')
        }
        // const [results1] = await nebula.sequelize.query(
        //     'select * from app_user_role'
        // )
        // console.log('results1', results1)
    }

    static listenCamundaTasks() {
        // Camunda 工作流监听
        CamundaTaskListener.listenUnHandledTask(async (task) => {
            nebula.logger.debug('listenUnHandledTask callback =====> %o', task)
            // event事件（create, complete, delete, timeout）
            const { event, processDefinitionId: definitionId } = task

            // 删除通知标志
            await CamundaService.deleteHistoryVariable(task.variableId)

            // 获取流程定义
            const processDefinition = await CamundaService.getProcessDefinition(
                definitionId
            )
            const { appId, envs = '' } = await AppProcessDef.getByUniqueKey(
                'camundaProcessId',
                definitionId
            )

            // 向所有环境发送应用消息
            for (const env of envs.split(',')) {
                // 向租户应用发送消息，租户收到消息后做一些处理
                MessageService.sendClientProcessMessage(event, appId, env, {
                    ...task,
                    processDefinition,
                })
            }

            // 发送站内流程消息
            await MessageService.sendAppUserTaskMessage(
                appId,
                task,
                processDefinition,
                event
            )
        })
    }
}
