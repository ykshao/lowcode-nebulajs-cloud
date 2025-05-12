import {
    Sequelize,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    ForeignKey,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { DataStatus } from '../config/constants'

export class ClApplication extends BaseModel<
    InferAttributes<ClApplication>,
    InferCreationAttributes<ClApplication>
> {
    declare id: string
    declare code: string
    declare name: string
    declare logo: string
    declare clientId: string
    declare clientSecret: string
    declare serverId: string
    declare serverName: ForeignKey<string>
    declare basePort: string
    declare camundaTenantId: string
    declare protocol: string
    declare domain: string
    declare status: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string

    static initAttributes = (sequelize) =>
        this.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
                code: {
                    type: DataTypes.STRING,
                    comment: '应用编码',
                    allowNull: false,
                    unique: true,
                },
                name: {
                    type: DataTypes.STRING,
                    comment: '名称',
                    allowNull: false,
                },
                logo: {
                    type: DataTypes.STRING,
                    comment: '应用LOGO',
                },
                clientId: {
                    type: DataTypes.UUID,
                    comment: '客户端ID',
                    defaultValue: DataTypes.UUIDV4,
                    unique: true,
                },
                clientSecret: {
                    type: DataTypes.UUID,
                    comment: '客户端密钥',
                    defaultValue: DataTypes.UUIDV4,
                },
                serverId: {
                    type: DataTypes.STRING,
                    comment: '机房ID',
                },
                basePort: {
                    type: DataTypes.STRING,
                    comment: '基础端口(端口前3位，500开始)',
                    allowNull: false,
                },
                protocol: {
                    type: DataTypes.STRING,
                    comment: '请求协议（http/https）',
                },
                domain: {
                    type: DataTypes.STRING,
                    comment: '应用域名',
                },
                camundaTenantId: {
                    type: DataTypes.STRING,
                    comment: 'Camunda租户ID',
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
            },
            {
                tableName: decamelize(ClApplication.prototype.constructor.name),
                underscored: true,
                comment: '应用',
                sequelize,
            }
        )
}
