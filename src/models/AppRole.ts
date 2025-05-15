import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
    HasManyAddAssociationMixin,
    HasManyRemoveAssociationMixin,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { DataStatus } from '../config/constants'
import { AppMenu } from './AppMenu'

export class AppRoleMenu extends BaseModel {
    static initAttributes = (sequelize) =>
        this.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
            },
            {
                tableName: decamelize(AppRoleMenu.prototype.constructor.name),
                underscored: true,
                comment: '角色菜单',
                sequelize,
                createdAt: false,
                updatedAt: false,
            }
        )
}
export class AppRole extends BaseModel<
    InferAttributes<AppRole>,
    InferCreationAttributes<AppRole>
> {
    declare id: string
    declare code: string
    declare name: string
    declare status: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string

    declare menus: NonAttribute<AppMenu[]>
    declare addMenu: HasManyAddAssociationMixin<AppMenu, string>
    declare removeMenu: HasManyRemoveAssociationMixin<AppMenu, string>

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
                    comment: '角色编码',
                },
                name: {
                    type: DataTypes.STRING,
                    comment: '角色名称',
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
                status: {
                    type: DataTypes.STRING(1),
                    comment: '状态（0:无效, 1:有效）',
                    defaultValue: DataStatus.ENABLED,
                },
                appId: {
                    type: DataTypes.STRING,
                    comment: '应用ID',
                },
            },
            {
                tableName: decamelize(AppRole.prototype.constructor.name),
                underscored: true,
                comment: '用户角色',
                indexes: [{ fields: ['app_id', 'code'] }],
                sequelize,
            }
        )

    static initAssociations() {
        AppRole.belongsToMany(AppMenu, {
            as: 'menus',
            through: AppRoleMenu,
            foreignKey: 'roleId',
            otherKey: 'menuId',
            onDelete: 'CASCADE',
        })
    }
}
