import {
    Sequelize,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'

export class ClPage extends BaseModel<
    InferAttributes<ClPage>,
    InferCreationAttributes<ClPage>
> {
    declare id: string
    declare name: string
    declare version: string
    declare url: string
    declare schema: string
    declare schemaFile: string
    declare isInternal: boolean
    declare isSystem: boolean
    declare lockedBy: string
    declare menuId: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string

    static initAttributes = (sequelize) =>
        this.init(
            {
                id: {
                    type: DataTypes.UUID,
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                    comment: 'ID',
                },
                name: {
                    type: DataTypes.STRING,
                    comment: '页面名称',
                },
                version: {
                    type: DataTypes.STRING,
                    comment: '版本号',
                },
                url: {
                    type: DataTypes.STRING,
                    comment: '页面路径',
                },
                schema: {
                    type: DataTypes.TEXT('long'),
                    comment: '页面代码（amis）',
                },
                schemaFile: {
                    type: DataTypes.TEXT('long'),
                    comment: 'JSON存储路径',
                },
                isInternal: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否内置页面',
                    defaultValue: false,
                },
                isSystem: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否系统页面',
                    defaultValue: false,
                },
                lockedBy: {
                    type: DataTypes.STRING,
                    comment: '锁定人',
                },
                menuId: {
                    type: DataTypes.STRING(50),
                    comment: '所属菜单',
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
                tableName: decamelize(ClPage.prototype.constructor.name),
                underscored: true,
                comment: '页面',
                indexes: [{ fields: ['app_id'] }],
                sequelize,
            }
        )
}
