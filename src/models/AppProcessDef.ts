import { BaseModel } from 'nebulajs-core'
import decamelize from 'decamelize'
import {
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import { AppProcessGroup } from './AppProcessGroup'
import { Constants, DataStatus } from '../config/constants'

export class AppProcessDef extends BaseModel<
    InferAttributes<AppProcessDef>,
    InferCreationAttributes<AppProcessDef>
> {
    declare id: string
    declare name: string
    declare icon: string
    declare formModel: string
    declare formName: string
    declare formSchema: string
    declare processJson: string
    declare settings: string
    declare camundaProcessKey: string
    declare camundaProcessId: string
    declare camundaDeploymentId: string
    declare envs: string
    declare notifies: string
    declare version: string
    declare status: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string
    declare groupId: ForeignKey<string>

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
                    comment: '流程名称',
                },
                icon: {
                    type: DataTypes.STRING,
                    comment: '图标',
                },
                formModel: {
                    type: DataTypes.STRING,
                    comment: '表单模型（空：通用）',
                    defaultValue: Constants.COMMON_FORM_MODEL,
                },
                formName: {
                    type: DataTypes.STRING,
                    comment: '表单名称',
                },
                formSchema: {
                    type: DataTypes.TEXT,
                    comment: '页面代码（amis）',
                },
                processJson: {
                    type: DataTypes.TEXT,
                    comment: '流程JSON（wflow）',
                },
                settings: {
                    type: DataTypes.TEXT,
                    comment: '流程设置JSON',
                },
                camundaProcessKey: {
                    type: DataTypes.STRING,
                    comment: 'Camunda流程定义Key',
                },
                camundaProcessId: {
                    type: DataTypes.STRING,
                    comment: 'Camunda流程定义ID',
                    unique: true,
                },
                camundaDeploymentId: {
                    type: DataTypes.STRING,
                    comment: 'Camunda流程发布ID',
                    unique: true,
                },
                envs: {
                    type: DataTypes.STRING,
                    comment: '运行环境',
                },
                notifies: {
                    type: DataTypes.STRING,
                    comment: '通知方式（逗号分割：INTERNAL,SMS,MAIL）',
                },
                version: {
                    type: DataTypes.STRING,
                    comment: '版本号（YYYYMMDDHHmmss）',
                },
                status: {
                    type: DataTypes.STRING(1),
                    comment: '状态（0:停用, 1:正常）',
                    defaultValue: DataStatus.ENABLED,
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
                tableName: decamelize(AppProcessDef.prototype.constructor.name),
                underscored: true,
                comment: '流程定义',
                indexes: [{ fields: ['app_id', 'camunda_process_id'] }],
                sequelize,
            }
        )

    static initAssociations() {
        AppProcessDef.belongsTo(AppProcessGroup, { as: 'group' })
    }
}
