import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    HasManyAddAssociationMixin,
    HasManyRemoveAssociationMixin,
    HasManyGetAssociationsMixin,
    NonAttribute,
    HasManySetAssociationsMixin,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { AppRole } from './AppRole'
import { AppOrganization } from './AppOrganization'
import { DataStatus } from '../config/constants'

export class AppUserRole extends BaseModel {
    static initAttributes = (sequelize) =>
        AppUserRole.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
            },
            {
                tableName: decamelize(AppUserRole.prototype.constructor.name),
                underscored: true,
                comment: '用户角色',
                sequelize,
                createdAt: false,
                updatedAt: false,
            }
        )
}

export class AppUserOrganization extends BaseModel {
    static initAttributes = (sequelize) =>
        AppUserOrganization.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
            },
            {
                tableName: decamelize(
                    AppUserOrganization.prototype.constructor.name
                ),
                underscored: true,
                comment: '用户组织',
                sequelize,
                createdAt: false,
                updatedAt: false,
            }
        )
}

export class AppUser extends BaseModel<
    InferAttributes<AppUser>,
    InferCreationAttributes<AppUser>
> {
    declare id: string
    declare login: string
    declare password: string
    declare mobile: string
    declare email: string
    declare name: string
    declare avatar: string
    declare deptId: string
    declare deptName: string
    declare position: string
    declare status: string
    declare lastLoginDate: Date
    declare lastLoginIp: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: string
    declare roles: NonAttribute<AppRole[]>
    declare orgs: NonAttribute<AppOrganization[]>

    declare setRoles: HasManySetAssociationsMixin<AppRole, string>
    declare addRole: HasManyAddAssociationMixin<AppRole, string>
    declare removeRole: HasManyRemoveAssociationMixin<AppRole, string>
    declare setOrgs: HasManySetAssociationsMixin<AppOrganization, string>
    declare addOrg: HasManyAddAssociationMixin<AppOrganization, string>
    declare removeOrg: HasManyRemoveAssociationMixin<AppOrganization, string>

    hasRole(roleCode: string): boolean {
        return (this.roles || []).some((r) => r.code === roleCode)
    }

    static initAttributes = (sequelize) =>
        this.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
                login: {
                    type: DataTypes.STRING(30),
                    comment: '用户名',
                },
                password: {
                    type: DataTypes.STRING,
                    comment: '密码',
                },
                name: {
                    type: DataTypes.STRING(30),
                    comment: '用户姓名',
                },
                avatar: {
                    type: DataTypes.STRING,
                    comment: '用户头像',
                },
                email: {
                    type: DataTypes.STRING(50),
                    comment: '用户邮箱',
                },
                mobile: {
                    type: DataTypes.STRING(20),
                    comment: '手机号',
                },
                lastLoginDate: {
                    type: DataTypes.DATE,
                    comment: '上次登录时间',
                },
                lastLoginIp: {
                    type: DataTypes.STRING(20),
                    comment: '上次登录IP',
                },
                deptId: {
                    type: DataTypes.STRING(50),
                    comment: '部门ID',
                },
                deptName: {
                    type: DataTypes.STRING(100),
                    comment: '部门名称',
                },
                position: {
                    type: DataTypes.STRING(255),
                    comment: '职位',
                },
                status: {
                    type: DataTypes.STRING(1),
                    comment: '状态（0:无效, 1:有效）',
                    defaultValue: DataStatus.ENABLED,
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
                tableName: decamelize(AppUser.prototype.constructor.name),
                underscored: true,
                comment: '用户',
                indexes: [{ fields: ['login', 'app_id'] }],
                sequelize,
            }
        )

    static initAssociations() {
        AppUser.belongsToMany(AppRole, {
            as: 'roles',
            through: AppUserRole,
            foreignKey: 'userId',
            otherKey: 'roleId',
            onDelete: 'CASCADE',
        })

        AppUser.belongsToMany(AppOrganization, {
            as: 'orgs',
            through: AppUserOrganization,
            foreignKey: 'userId',
            otherKey: 'orgId',
            onDelete: 'CASCADE',
        })
    }
}
