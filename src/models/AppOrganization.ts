import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import decamelize from 'decamelize'
import { BaseModel } from 'nebulajs-core'
import { DataStatus } from '../config/constants'

export class AppOrganization extends BaseModel<
    InferAttributes<AppOrganization>,
    InferCreationAttributes<AppOrganization>
> {
    declare id: string
    declare code: string
    declare shortName: string
    declare name: string
    declare parentId: string
    declare parentName: string
    declare seq: number
    declare type: string
    declare isComp: boolean
    declare leader: string
    declare status: string
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
                code: {
                    type: DataTypes.STRING,
                    comment: '编码',
                },
                shortName: {
                    type: DataTypes.STRING,
                    comment: '简称',
                },
                name: {
                    type: DataTypes.STRING,
                    comment: '名称',
                },
                parentId: {
                    type: DataTypes.STRING,
                    comment: '父级ID',
                },
                parentName: {
                    type: DataTypes.STRING,
                    comment: '父级名称',
                },
                seq: {
                    type: DataTypes.INTEGER,
                    comment: '显示顺序',
                },
                type: {
                    type: DataTypes.STRING,
                    comment: '类型',
                },
                isComp: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否公司',
                },
                leader: {
                    type: DataTypes.STRING,
                    comment: '负责人',
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
                tableName: decamelize(
                    AppOrganization.prototype.constructor.name
                ),
                underscored: true,
                comment: '组织',
                indexes: [{ fields: ['code', 'app_id'] }],
                sequelize,
            }
        )
}
