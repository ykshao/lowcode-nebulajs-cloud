import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    ForeignKey,
    HasManyGetAssociationsMixin,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { ClModelProp } from './ClModelProp'
import { ClModelRef } from './ClModelRef'

export class ClModel extends BaseModel<
    InferAttributes<ClModel>,
    InferCreationAttributes<ClModel>
> {
    declare id: string
    declare name: string
    declare comment: string
    declare tableName: string
    declare tableSchema: string
    declare isSynced: boolean
    declare isSoftDelete: boolean
    declare withProcess: boolean
    declare processStatusField: string
    declare dataAccess: string
    declare createdAtField: string
    declare createdByField: string
    declare updatedAtField: string
    declare updatedByField: string
    declare deletedAtField: string
    declare tags: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string
    declare props: ForeignKey<ClModelProp[]>

    declare getProps: HasManyGetAssociationsMixin<ClModelProp>
    declare getRefs: HasManyGetAssociationsMixin<ClModelRef>

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
                    allowNull: false,
                },
                comment: {
                    type: DataTypes.STRING,
                    comment: '中文名称',
                },
                tableName: {
                    type: DataTypes.STRING,
                    comment: '数据库表名',
                },
                tableSchema: {
                    type: DataTypes.STRING,
                    comment: '数据库',
                },
                isSynced: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否已同步到数据库',
                    defaultValue: false,
                },
                isSoftDelete: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否软删除',
                    defaultValue: false,
                },
                withProcess: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否可发起流程',
                    defaultValue: false,
                },
                processStatusField: {
                    type: DataTypes.STRING,
                    comment: '流程状态字段',
                    defaultValue: 'status',
                },
                dataAccess: {
                    type: DataTypes.STRING,
                    comment: '数据权限（ALL, COMPANY, DEPT, OWNER）',
                    defaultValue: 'ALL',
                },
                createdAtField: {
                    type: DataTypes.STRING,
                    comment: '创建时间字段',
                    defaultValue: 'createdAt',
                },
                createdByField: {
                    type: DataTypes.STRING,
                    comment: '创建人字段',
                    defaultValue: 'createdBy',
                },
                updatedAtField: {
                    type: DataTypes.STRING,
                    comment: '更新时间字段',
                    defaultValue: 'updatedAt',
                },
                updatedByField: {
                    type: DataTypes.STRING,
                    comment: '更新人字段',
                    defaultValue: 'updatedBy',
                },
                deletedAtField: {
                    type: DataTypes.STRING,
                    comment: '删除时间字段',
                    defaultValue: 'deletedAt',
                },
                tags: {
                    type: DataTypes.STRING,
                    comment: '标签',
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
                    allowNull: false,
                },
            },
            {
                tableName: decamelize(ClModel.prototype.constructor.name),
                underscored: true,
                comment: '数据模型',
                indexes: [{ fields: ['app_id', 'name'] }],
                sequelize,
                // hooks: {
                //     afterSave(instance, options) {
                //         console.log('custom hooks')
                //         instance.addHook()
                //     },
                // },
            }
        )
    static initAssociations() {
        ClModel.hasMany(ClModelProp, {
            as: 'props',
            foreignKey: 'modelId',
            onDelete: 'CASCADE',
        })

        ClModel.hasMany(ClModelRef, {
            as: 'refs',
            foreignKey: 'modelId',
            onDelete: 'CASCADE',
        })

        ClModelProp.belongsTo(ClModel, {
            as: 'model',
        })

        ClModelRef.belongsTo(ClModel, {
            as: 'model',
        })
    }
}
