import {
    Sequelize,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    ForeignKey,
    NonAttribute,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { ClApplication } from './ClApplication'

export class ClAppInfo extends BaseModel<
    InferAttributes<ClAppInfo>,
    InferCreationAttributes<ClAppInfo>
> {
    declare id: string
    declare gitUrl: string
    declare gitBranch: string
    declare gitUsername: string
    declare gitPassword: string
    declare vsCodePassword: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string
    declare appId: ForeignKey<string>
    declare app: NonAttribute<ClApplication>

    static initAttributes = (sequelize) =>
        this.init(
            {
                id: {
                    type: DataTypes.UUID,
                    comment: 'ID',
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
                gitUrl: {
                    type: DataTypes.STRING,
                    comment: 'Git地址',
                },
                gitBranch: {
                    type: DataTypes.STRING,
                    comment: 'Git分支',
                },
                gitUsername: {
                    type: DataTypes.STRING,
                    comment: '用户名',
                },
                gitPassword: {
                    type: DataTypes.STRING,
                    comment: '密码',
                },
                vsCodePassword: {
                    type: DataTypes.STRING,
                    comment: 'VSCODE密码',
                },
                appId: {
                    type: DataTypes.UUID,
                    comment: '应用ID',
                    unique: true,
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
                tableName: decamelize(ClAppInfo.prototype.constructor.name),
                underscored: true,
                comment: '应用配置',
                sequelize,
            }
        )

    static initAssociations() {
        ClAppInfo.belongsTo(ClApplication, {
            as: 'app',
        })
    }
}
