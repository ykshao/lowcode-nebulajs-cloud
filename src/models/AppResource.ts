import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'

export class AppResource extends BaseModel<
    InferAttributes<AppResource>,
    InferCreationAttributes<AppResource>
> {
    declare id: string
    declare name: string
    declare key: string
    declare type: string
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
                    comment: '权限标识',
                },

                /**
                 * 权限类型
                 * 1. 接口权限
                 * 2. 数据权限
                 * 3. 页面权限（菜单）
                 * 4. 元素权限
                 */
                type: {
                    type: DataTypes.STRING,
                    comment: '类型',
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
                tableName: decamelize(AppResource.prototype.constructor.name),
                underscored: true,
                comment: '权限资源',
                sequelize,
            }
        )
}
