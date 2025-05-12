import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'

export class AppFile extends BaseModel<
    InferAttributes<AppFile>,
    InferCreationAttributes<AppFile>
> {
    declare id: string
    declare name: string
    declare key: string
    declare url: string
    declare type: string
    declare size: number
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
                name: {
                    type: DataTypes.STRING,
                    comment: '名称',
                },
                key: {
                    type: DataTypes.STRING,
                    comment: '文件Key（bucket:name）',
                },
                url: {
                    type: DataTypes.STRING,
                    comment: 'URL',
                },
                type: {
                    type: DataTypes.STRING,
                    comment: '类型（扩展名大写）',
                },
                size: {
                    type: DataTypes.BIGINT,
                    comment: '大小',
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
                tableName: decamelize(AppFile.prototype.constructor.name),
                underscored: true,
                comment: '文件',
                sequelize,
            }
        )
}
