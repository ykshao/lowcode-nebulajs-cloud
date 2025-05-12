import { MiddlewareService } from './MiddlewareService'
import { Model, Op } from 'sequelize'
import camelCase from 'camelcase'
import {
    NebulaBizError,
    NebulaErrors,
    SequelizeTypeMapper,
    BaseModel,
    Constants,
    SocketEvent,
} from 'nebulajs-core'
import path from 'path'
import fs from 'fs'
import { ApplicationErrors } from '../config/errors'
import { DatabaseService } from './common/DatabaseService'
import { ApplicationService } from './ApplicationService'
import { AuditModelProps, Websocket } from '../config/constants'
import { ClModel } from '../models/ClModel'
import { ClModelProp } from '../models/ClModelProp'
import { ClModelRef } from '../models/ClModelRef'
import { ClApi } from '../models/ClApi'
import { ClApplication } from '../models/ClApplication'

export type SyncFromTableConfig = {
    [table: string]: {
        comment: string
        columns: {
            [name: string]: {
                comment: string
            }
        }
    }
}
export class ModelService {
    /**
     * 同步远程数据库表结构到本地数据库
     *
     * @param appId {String} 应用ID
     * @param database {Model} 数据库model
     * @param names {array} 表名列表
     * @param prefix {string} Model前缀
     * @param tablesConfig 表、列配置
     * @returns {Promise<number>} 同步表数量
     */
    static async syncFromDatabase(
        appId,
        database,
        names: string[],
        prefix = '',
        tablesConfig: SyncFromTableConfig = {}
    ) {
        const middlewareService = new DatabaseService(database.dataValues)
        const metadata = await middlewareService.getDatabaseMetadata(names)
        const typeMapper = SequelizeTypeMapper.getInstance(
            database.dataValues.type
        )
        const modelMap = new Map()
        const models = await ClModel.findAll({
            where: {
                appId,
                tableName: {
                    [Op.in]: names.map((s) => prefix + s),
                },
            },
            include: [
                {
                    model: ClModelProp,
                    as: 'props',
                },
                {
                    model: ClModelRef,
                    as: 'refs',
                },
            ],
        })
        models.forEach((m) => modelMap.set(m.dataValues.name, m))

        // 开始事务
        let count = 0
        const transaction = await nebula.sequelize.transaction()
        try {
            for (const name in metadata.tables) {
                const table = metadata.tables[name]
                const tabName = prefix + name
                const modelName = camelCase(tabName, { pascalCase: true })
                // 从Map中获取实例或创建
                const model = modelMap.get(modelName) || ClModel.build()
                model.set({
                    name: modelName,
                    comment:
                        model.comment ||
                        tablesConfig[name]?.comment ||
                        table.comment, // 多次同步不会覆盖
                    tableName: tabName,
                    tableSchema: table.name.split(/\./)[0],
                    appId,
                    isSynced: true,
                })
                const { id: modelId, props = [], refs = [] } = model.dataValues

                // 主表处理
                await model.save({ transaction })

                // 表外键处理
                for (const fk of table.foreignKeys) {
                    const refTableName =
                        prefix + fk.references.table.split('.')[1]
                    const refModel = camelCase(refTableName, {
                        pascalCase: true,
                    })
                    const refProp = camelCase(fk.references.columns[0])
                    const srcProp = camelCase(fk.columns[0])
                    const ref =
                        refs.find(
                            (r) => r.dest === refModel && r.destProp === refProp
                        ) || ClModelRef.build()
                    ref.set({
                        ref: 'belongsTo',
                        src: modelName,
                        srcProp,
                        dest: refModel,
                        destProp: refProp,
                        appId,
                        modelId,
                        alias: refModel,
                    })
                    await ref.save({ transaction })
                }

                // 表字段处理
                for (let i = 0; i < table.columns.length; i++) {
                    // 从Map中获取实例或创建
                    const column = table.columns[i]
                    const propName = camelCase(column.name)
                    const prop: ClModelProp =
                        props.find((p) => p.name === propName) ||
                        ClModelProp.build()
                    prop.set({
                        name: propName,
                        fieldName: column.name,
                        comment:
                            prop.comment ||
                            tablesConfig[name]?.columns[column.name]?.comment ||
                            column.comment ||
                            propName, // 多次同步不会覆盖
                        len: column.maxLength,
                        seq: i + 1,
                        nullable: column.nullable,
                        type: typeMapper.map(column.type),
                        appId,
                        modelId,
                        isPk: table.primaryKey?.columns?.includes(column.name),
                    })
                    await prop.save({ transaction })
                }
                count++
            }
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            throw e
        }
        return count
    }

    /**
     * 同步更改到数据库
     * @returns {Promise<void>}
     */
    static async syncToDatabase(appModel: ClApplication, env, names) {
        // 发送ws消息给客户端
        const socketKey = Websocket.getAppSocketKey(appModel.id, env)
        const socket = nebula.socketMap.get(socketKey)
        if (!socket) {
            throw new NebulaBizError(ApplicationErrors.ApplicationNotConnected)
        }
        socket.emit(SocketEvent.ModelSync, { names })
        await ClModel.update(
            {
                isSynced: true,
            },
            {
                where: {
                    name: {
                        [Op.in]: names,
                    },
                    appId: appModel.id,
                },
                individualHooks: true,
            }
        )
    }

    /**
     * 更新模型
     * @param body
     * @returns {Promise<void>}
     */
    static async updateModel(body) {
        const { id, appId, props = [], refs = [] } = body
        const model = await ClModel.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        props.forEach((p) => {
            p.appId = appId
            p.modelId = id
            p.len = !p.len ? null : p.len
        })
        refs.forEach((r) => {
            r.appId = appId
            r.modelId = id
        })
        const transaction = await nebula.sequelize.transaction()
        try {
            model.set({ ...body, isSynced: false })
            const result = await model.save({ transaction })
            const existProps = await model.getProps()
            for (const pm of existProps) {
                // 入参里没找到，说明被删除了
                if (!props.find((p) => pm.dataValues.id === p.id)) {
                    await pm.destroy({ transaction })
                }
            }
            for (const prop of props) {
                await ClModelProp.upsert(prop, { transaction })
            }
            const existRefs = await model.getRefs()
            for (const rm of existRefs) {
                // 入参里没找到，说明被删除了
                if (!refs.find((r) => rm.dataValues.id === r.id)) {
                    await rm.destroy({ transaction })
                }
            }
            for (const ref of refs) {
                await ClModelRef.upsert(ref, { transaction })
            }

            await transaction.commit()
            return result
        } catch (e) {
            await transaction.rollback()
            throw e
        }
    }

    /**
     * 创建模型
     * @param body
     * @returns {Promise<BaseModel>}
     */
    static async createModel(body) {
        const { props = [], refs = [] } = body
        props.forEach((p) => {
            p.appId = body.appId
        })
        refs.forEach((r) => {
            r.appId = body.appId
        })
        const transaction = await nebula.sequelize.transaction()
        try {
            const result = await ClModel.create(body, {
                include: [
                    {
                        model: ClModelProp,
                        as: 'props',
                    },
                    {
                        model: ClModelRef,
                        as: 'refs',
                    },
                ],
                transaction,
            })
            await transaction.commit()
            return result
        } catch (e) {
            await transaction.rollback()
            throw e
        }
    }

    static async deleteModel(id) {
        const model = await ClModel.getByPk(id)
        const { name, appId } = model.dataValues
        const appModel = await ClApplication.getByPk(appId)
        const { code } = appModel.dataValues
        const modelFile = path.join(
            ApplicationService.getAppDataSrcPath(code),
            nebula.modelPath,
            `${name}.js`
        )
        const restFile = path.join(
            ApplicationService.getAppDataSrcPath(code),
            './resources',
            `${name}Rest.js`
        )

        const transaction = await nebula.sequelize.transaction()
        try {
            await model.destroy({ transaction })
            await ClApi.destroy({
                where: {
                    model: model.dataValues.name,
                    appId,
                    isCustom: false,
                },
                individualHooks: true,
                transaction,
            })
            fs.existsSync(modelFile) && fs.unlinkSync(modelFile)
            fs.existsSync(restFile) && fs.unlinkSync(restFile)
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            throw e
        }
    }

    static async getModelDictKeys(appId, modelName) {
        const model = await ClModel.findOne({
            where: {
                name: modelName,
                appId,
            },
            include: [
                {
                    model: ClModelProp,
                    as: 'props',
                    attributes: {
                        exclude: ['modelId', 'appId', ...AuditModelProps],
                    },
                },
            ],
        })
        const dictCodes = model.dataValues.props
            .filter((p) => p.dataValues.dictCode)
            .map((p) => p.dataValues.dictCode)
        const set = new Set<string>(dictCodes)
        return Array.from(set).join(',')
    }

    private static PROPS_NAME_SORT = {
        id: -1,
        remark: 1,
        createdAt: 2,
        createdBy: 3,
        updatedAt: 4,
        updatedBy: 5,
    }
    private static PROPS_TYPE_SORT = {
        STRING: -1,
        TEXT: 1,
    }
    static modelPropsSortFn(a: ClModelProp, b: ClModelProp) {
        const orderA = ModelService.PROPS_NAME_SORT[a.name] || 0
        const orderB = ModelService.PROPS_NAME_SORT[b.name] || 0
        if (orderA === orderB) {
            const typeA = ModelService.PROPS_TYPE_SORT[a.type] || 0
            const typeB = ModelService.PROPS_TYPE_SORT[b.type] || 0
            return typeA - typeB
        } else {
            return orderA - orderB
        }
    }
}
