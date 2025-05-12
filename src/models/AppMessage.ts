import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize'
import { BaseModel } from 'nebulajs-core'
import decamelize from 'decamelize'

export class AppMessage extends BaseModel<
    InferAttributes<AppMessage>,
    InferCreationAttributes<AppMessage>
> {
    declare id: string
    declare login: string
    declare mobile: string
    declare name: string
    declare type: string
    declare title: string
    declare content: string
    // declare level: string
    declare link: string
    declare extra: string
    declare read: boolean
    declare readTime: Date
    declare notifyTypes: string
    declare notifyResults: string
    declare appId: string
    declare createdBy: string
    declare updatedBy: string
    declare remark: string

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
                    type: DataTypes.STRING(50),
                    comment: '用户名',
                },
                mobile: {
                    type: DataTypes.STRING(30),
                    comment: '手机号',
                },
                name: {
                    type: DataTypes.STRING(30),
                    comment: '用户姓名',
                },
                type: {
                    type: DataTypes.STRING(30),
                    comment: '消息类型',
                },
                title: {
                    type: DataTypes.STRING,
                    comment: '标题',
                },
                content: {
                    type: DataTypes.STRING,
                    comment: '内容',
                },
                // level: {
                //     type: DataTypes.STRING(30),
                //     comment: '级别（提示，警告，紧急）',
                // },
                link: {
                    type: DataTypes.STRING(500),
                    comment: '链接',
                },
                extra: {
                    type: DataTypes.TEXT,
                    comment: '附加数据',
                },
                read: {
                    type: DataTypes.BOOLEAN,
                    comment: '是否已读',
                    defaultValue: false,
                },
                readTime: {
                    type: DataTypes.DATE,
                    comment: '查看时间',
                },
                /**
                 * 原notifies
                 */
                notifyTypes: {
                    type: DataTypes.STRING(50),
                    comment: '通知方式（逗号分割：INTERNAL,SMS,MAIL,OA）',
                },
                notifyResults: {
                    type: DataTypes.TEXT,
                    comment: '通知结果JSON（{通知方式:true|false}）',
                    defaultValue: '{}',
                },
                appId: {
                    type: DataTypes.STRING,
                    comment: '应用ID',
                    allowNull: false,
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
                tableName: decamelize(AppMessage.prototype.constructor.name),
                underscored: true,
                comment: '用户消息',
                indexes: [{ fields: ['app_id', 'login'] }],
                sequelize,
            }
        )
}
