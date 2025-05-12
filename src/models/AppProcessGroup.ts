import { BaseModel } from 'nebulajs-core'
import decamelize from 'decamelize'
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize'

export class AppProcessGroup extends BaseModel<
    InferAttributes<AppProcessGroup>,
    InferCreationAttributes<AppProcessGroup>
> {
    declare id: string
    declare tag: string
    declare name: string
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
                tag: {
                    type: DataTypes.STRING,
                    comment: '分类标签',
                },
                name: {
                    type: DataTypes.STRING,
                    comment: '分类名称',
                },
                seq: {
                    type: DataTypes.INTEGER,
                    comment: '显示顺序',
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
                    AppProcessGroup.prototype.constructor.name
                ),
                underscored: true,
                comment: '流程分类',
                sequelize,
            }
        )
}
