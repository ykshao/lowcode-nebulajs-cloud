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
    declare method: string
    declare url: string
    declare pageId: string
    declare pageName: string
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
                    comment: '权限名称',
                },
                key: {
                    type: DataTypes.STRING(30),
                    comment: '权限标识',
                },
                /**
                 * 接口请求方式
                 */
                method: {
                    type: DataTypes.STRING(30),
                    comment: '请求方式（*,GET,POST,PUT...）',
                },
                /**
                 * 接口路径
                 */
                url: {
                    type: DataTypes.STRING(100),
                    comment: '类型',
                },
                pageId: {
                    type: DataTypes.UUID,
                    comment: '页面ID',
                },
                pageName: {
                    type: DataTypes.STRING,
                    comment: '页面名称',
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
                tableName: decamelize(AppResource.prototype.constructor.name),
                underscored: true,
                comment: '权限资源',
                indexes: [{ fields: ['app_id'] }],
                sequelize,
            }
        )

    static initAssociations() {}
}
