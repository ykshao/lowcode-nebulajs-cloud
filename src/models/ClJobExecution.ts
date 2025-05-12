import { BaseModel } from 'nebulajs-core'
import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    ForeignKey,
} from 'sequelize'
import decamelize from 'decamelize'
import { JobStatus } from '../config/constants'

export class ClJobExecution extends BaseModel<
    InferAttributes<ClJobExecution>,
    InferCreationAttributes<ClJobExecution>
> {
    declare id: string
    declare name: string
    declare env: string
    declare status: string
    declare result: boolean
    declare logfile: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string
    declare jobId: string

    static initAttributes = (sequelize) =>
        this.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
                name: {
                    type: DataTypes.STRING,
                    comment: '名称',
                },
                env: {
                    type: DataTypes.STRING,
                    comment: '运行环境',
                },
                status: {
                    type: DataTypes.STRING,
                    comment: '状态（0:未运行，1:运行中，2:完成）',
                    defaultValue: JobStatus.CREATED,
                },
                result: {
                    type: DataTypes.BOOLEAN,
                    comment: '运行结果（成功/失败）',
                },
                logfile: {
                    type: DataTypes.STRING(500),
                    comment: '日志文件',
                },
                jobId: {
                    type: DataTypes.STRING,
                    comment: '任务ID',
                },
                createdBy: {
                    type: DataTypes.STRING,
                    comment: '创建人',
                },
                updatedBy: {
                    type: DataTypes.STRING,
                    comment: '更新人',
                },
                remark: {
                    type: DataTypes.STRING,
                    comment: '备注',
                },
                appId: {
                    type: DataTypes.STRING,
                    comment: '应用ID',
                },
            },
            {
                tableName: decamelize(
                    ClJobExecution.prototype.constructor.name
                ),
                underscored: true,
                comment: '任务',
                sequelize,
            }
        )
}
