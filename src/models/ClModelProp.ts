import {
    Sequelize,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    ForeignKey,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'

export class ClModelProp extends BaseModel<
    InferAttributes<ClModelProp>,
    InferCreationAttributes<ClModelProp>
> {
    declare id: string
    declare name: string
    declare fieldName: string
    declare comment: string
    declare type: string
    declare len: string
    declare seq: number
    declare nullable: boolean
    declare isPk: boolean
    declare canInsert: boolean
    declare canUpdate: boolean
    declare canFilter: boolean
    declare dictCode: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string

    declare modelId: ForeignKey<string>

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
                    type: DataTypes.STRING(50),
                    comment: '属性名称',
                },
                fieldName: {
                    type: DataTypes.STRING(50),
                    comment: '字段名称',
                },
                comment: {
                    type: DataTypes.STRING,
                    comment: '中文名称',
                },
                type: {
                    type: DataTypes.STRING(30),
                    comment: '类型（对应sequelize类型）',
                },
                len: {
                    type: DataTypes.STRING(30),
                    comment: '长度（x[,y]）',
                },
                seq: {
                    type: DataTypes.INTEGER,
                    comment: '顺序',
                },
                nullable: {
                    type: DataTypes.BOOLEAN,
                    comment: '可为空',
                },
                isPk: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否主键',
                },
                canInsert: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否可被新增（REST接口）',
                    defaultValue: true,
                },
                canUpdate: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否可被更新（REST接口）',
                    defaultValue: true,
                },
                canFilter: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否可查询（页面）',
                    defaultValue: false,
                },
                dictCode: {
                    type: DataTypes.STRING(50),
                    comment: '字典编码',
                },
                createdBy: {
                    type: DataTypes.STRING(50),
                    comment: '创建人',
                },
                updatedBy: {
                    type: DataTypes.STRING(50),
                    comment: '更新人',
                },
                remark: {
                    type: DataTypes.STRING,
                    comment: '备注',
                },
                appId: {
                    type: DataTypes.UUID,
                    comment: '应用ID',
                    allowNull: false,
                },
            },
            {
                tableName: decamelize(ClModelProp.prototype.constructor.name),
                underscored: true,
                comment: '模型字段',
                indexes: [{ fields: ['app_id'] }],
                sequelize,
            }
        )
}
