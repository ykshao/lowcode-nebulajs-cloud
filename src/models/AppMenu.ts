import {
    Sequelize,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'

export class AppMenu extends BaseModel<
    InferAttributes<AppMenu>,
    InferCreationAttributes<AppMenu>
> {
    declare id: string
    declare pid: string
    declare group: string
    declare label: string
    declare url: string
    declare isSystem: boolean
    declare link: string
    declare redirect: string
    declare visible: boolean
    declare icon: string
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
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                    comment: 'ID',
                },
                pid: {
                    type: DataTypes.STRING,
                    comment: '父ID',
                },
                group: {
                    type: DataTypes.STRING,
                    comment: '分组',
                },
                label: {
                    type: DataTypes.STRING,
                    comment: '名称',
                },
                url: {
                    type: DataTypes.STRING,
                    comment: '页面路径',
                },
                isSystem: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否系统菜单',
                    defaultValue: false,
                },
                link: {
                    type: DataTypes.STRING,
                    comment: '外部链接',
                },
                redirect: {
                    type: DataTypes.STRING,
                    comment: '跳转',
                },
                visible: {
                    type: DataTypes.BOOLEAN,
                    comment: '可见',
                    defaultValue: true,
                },
                icon: {
                    type: DataTypes.STRING,
                    comment: '图标',
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
                tableName: decamelize(AppMenu.prototype.constructor.name),
                underscored: true,
                comment: '菜单',
                indexes: [{ fields: ['app_id'] }],
                sequelize,
            }
        )
}
