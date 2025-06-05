import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'

export class AppDict extends BaseModel<
    InferAttributes<AppDict>,
    InferCreationAttributes<AppDict>
> {
    declare id: string
    declare code: string
    declare value: string
    declare label: string
    declare seq: number
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string

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
                    comment: '编码',
                },
                value: {
                    type: DataTypes.STRING,
                    comment: '值',
                },
                label: {
                    type: DataTypes.STRING,
                    comment: '显示',
                },
                seq: {
                    type: DataTypes.BIGINT,
                    comment: '顺序',
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
                    type: DataTypes.UUID,
                    comment: '应用ID',
                },
            },
            {
                tableName: decamelize(AppDict.prototype.constructor.name),
                underscored: true,
                comment: '字典',
                indexes: [{ fields: ['app_id', 'code'] }],
                sequelize,
            }
        )
}
