import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    ForeignKey,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { ClApplication } from './ClApplication'
import { ClInstance } from './ClInstance'

export class ClMiddleware extends BaseModel<
    InferAttributes<ClMiddleware>,
    InferCreationAttributes<ClMiddleware>
> {
    declare id: string
    declare name: string
    declare type: string
    declare host: string
    declare port: string
    declare schema: string
    declare isExternal: boolean
    declare username: string
    declare password: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: ForeignKey<string>

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
                    comment: '中间件名称',
                },
                type: {
                    type: DataTypes.STRING,
                    comment: '中间件类型（mysql,redis等）',
                    allowNull: false,
                },
                host: {
                    type: DataTypes.STRING,
                    comment: '主机/IP（外部）',
                },
                port: {
                    type: DataTypes.INTEGER,
                    comment: '端口（外部）',
                },
                schema: {
                    type: DataTypes.STRING,
                    comment: '数据库名',
                },
                isExternal: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否外部中间件',
                },
                username: {
                    type: DataTypes.STRING,
                    comment: '用户名',
                },
                password: {
                    type: DataTypes.STRING,
                    comment: '密码',
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
                tableName: decamelize(ClMiddleware.prototype.constructor.name),
                underscored: true,
                comment: '用户中间件',
                sequelize,
            }
        )
    static initAssociations() {
        ClInstance.belongsTo(ClMiddleware, {
            as: 'middleware',
        })
        ClMiddleware.hasOne(ClInstance, {
            foreignKey: 'middlewareId',
            as: 'instance',
        })
        ClMiddleware.belongsTo(ClApplication, {
            as: 'app',
        })
    }
}
