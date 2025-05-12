import { BaseModel } from 'nebulajs-core'
import {
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import { ClApplication } from './ClApplication'
import decamelize from 'decamelize'

export class ClApi extends BaseModel<
    InferAttributes<ClApi>,
    InferCreationAttributes<ClApi>
> {
    declare id: string
    declare name: string
    declare method: string
    declare parameters: string
    declare responses: string
    declare tag: string
    declare path: string
    declare model: string
    declare description: string
    declare isCustom: boolean
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
                    comment: '名称',
                },
                method: {
                    type: DataTypes.STRING,
                    comment: '请求方法',
                    allowNull: false,
                },
                parameters: {
                    type: DataTypes.TEXT,
                    comment: '参数',
                },
                responses: {
                    type: DataTypes.TEXT,
                    comment: '响应',
                },
                tag: {
                    type: DataTypes.STRING,
                    comment: '标签',
                },
                path: {
                    type: DataTypes.STRING,
                    comment: '路径',
                    allowNull: false,
                },
                model: {
                    type: DataTypes.STRING,
                    comment: '模型',
                },
                description: {
                    type: DataTypes.STRING,
                    comment: '描述',
                },
                isCustom: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否自定义',
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
                tableName: decamelize(ClApi.prototype.constructor.name),
                underscored: true,
                comment: '应用',
                sequelize,
            }
        )
    static initAssociations() {
        ClApi.belongsTo(ClApplication, {
            as: 'app',
        })
    }
}
