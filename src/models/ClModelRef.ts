import {
    Sequelize,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import path from 'path'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'

export class ClModelRef extends BaseModel<
    InferAttributes<ClModelRef>,
    InferCreationAttributes<ClModelRef>
> {
    declare id: string
    declare ref: string
    declare src: string
    declare srcProp: string
    declare dest: string
    declare destProp: string
    declare onDelete: string
    declare onUpdate: string
    declare alias: string
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
                ref: {
                    type: DataTypes.STRING,
                    comment: '对应关系',
                },
                src: {
                    type: DataTypes.STRING,
                    comment: '源模型',
                },
                srcProp: {
                    type: DataTypes.STRING,
                    comment: '源属性',
                },
                dest: {
                    type: DataTypes.STRING,
                    comment: '目标模型',
                },
                destProp: {
                    type: DataTypes.STRING,
                    comment: '目标属性',
                },
                onDelete: {
                    type: DataTypes.STRING,
                    comment: '删除规则',
                },
                onUpdate: {
                    type: DataTypes.STRING,
                    comment: '更新规则',
                },
                alias: {
                    type: DataTypes.STRING,
                    comment: '别名',
                },
                appId: {
                    type: DataTypes.UUID,
                    comment: '应用ID',
                    allowNull: false,
                },
            },
            {
                tableName: decamelize(ClModelRef.prototype.constructor.name),
                underscored: true,
                comment: '模型关系',
                indexes: [{ fields: ['app_id'] }],
                sequelize,
            }
        )
}
