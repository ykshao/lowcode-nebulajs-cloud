import {
    Sequelize,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    ForeignKey,
    NonAttribute,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { ClApplication } from './ClApplication'
import { AuthTypes } from '../config/constants'

export class ClAppProfile extends BaseModel<
    InferAttributes<ClAppProfile>,
    InferCreationAttributes<ClAppProfile>
> {
    declare id: string
    declare env: string
    declare logLevel: string
    declare databaseIns: string
    declare databaseName: string
    declare redisIns: string
    declare redisName: string
    declare authConfigText: string
    declare content: string
    declare bizContent: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: ForeignKey<string>
    declare app: ForeignKey<ClApplication>
    declare authConfig: NonAttribute<{}>

    static initAttributes = (sequelize) =>
        this.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
                env: {
                    type: DataTypes.STRING,
                    comment: '环境',
                },
                databaseIns: {
                    type: DataTypes.STRING,
                    comment: '数据库中间件实例ID',
                },
                databaseName: {
                    type: DataTypes.STRING,
                    comment: '数据库中间件名称',
                },
                redisIns: {
                    type: DataTypes.STRING,
                    comment: '缓存中间件实例ID',
                },
                redisName: {
                    type: DataTypes.STRING,
                    comment: '缓存中间件名称',
                },
                logLevel: {
                    type: DataTypes.STRING,
                    comment: '日志级别',
                },
                authConfigText: {
                    type: DataTypes.TEXT,
                    comment: '认证配置（JSON）',
                },
                content: {
                    type: DataTypes.TEXT,
                    comment: '系统配置内容',
                },
                bizContent: {
                    type: DataTypes.TEXT,
                    comment: '业务配置内容',
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
                tableName: decamelize(ClAppProfile.prototype.constructor.name),
                underscored: true,
                comment: '应用配置',
                sequelize,
            }
        )

    static initAssociations() {
        ClAppProfile.belongsTo(ClApplication, {
            as: 'app',
        })
    }
}
