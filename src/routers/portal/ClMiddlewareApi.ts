import {
    NebulaKoaContext,
    NebulaErrors,
    NebulaBizError,
    QueryParser,
} from 'nebulajs-core'
import { MiddlewareTypes } from '../../config/constants'
import { MiddlewareService } from '../../services/MiddlewareService'
import { ApplicationErrors } from '../../config/errors'
import { DatabaseService } from '../../services/common/DatabaseService'
import { ClMiddleware } from '../../models/ClMiddleware'
import { ClInstance } from '../../models/ClInstance'
import { CommonUtils } from 'nebulajs-core/lib/utils'
import path from 'path'

export = {
    'post /cl-middleware': async (ctx, next) => {
        ctx.checkRequired(['type'])
        const body = ctx.request.body
        const created = await MiddlewareService.createMiddleware(
            ctx.appId,
            body
        )
        ctx.ok(created)
    },

    'put /cl-middleware': async (ctx, next) => {
        ctx.checkRequired(['id'])
        const id = ctx.getParam('id')
        const { name, hostPort, schema, username, password, dataPath } =
            ctx.request.body
        const { host, port } = hostPort || {}
        const model = await ClMiddleware.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const { isExternal, type } = model.dataValues
        if (isExternal || type === 'sqlite') {
            model.set({
                name,
                host,
                port,
                schema,
                username,
                password,
                dataPath,
            })
        } else {
            model.set({ name })
        }

        const { dataValues } = await model.save()
        ctx.ok(dataValues)
    },

    'delete /cl-middleware/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const model = await ClMiddleware.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        await MiddlewareService.deleteMiddleware(model)
        ctx.ok()
    },

    'get /cl-middleware': async function (ctx, next) {
        const appId = ctx.appId
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await ClMiddleware.findAndCountAll({
            where: {
                ...where,
                appId,
            },
            include: {
                model: ClInstance,
                as: 'instance',
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        const records = rows.map((m: any) => {
            m.dataValues.hostPort = {
                host: m.dataValues.host,
                port: m.dataValues.port,
            }
            return m
        })
        ctx.ok(records)
        ctx.set('X-Total-Count', count)
    },

    /**
     * 测试中间件连接
     * @param ctx {NebulaKoaContext}
     * @param next
     * @returns {Promise<any>}
     */
    'post /cl-middleware/test': async (ctx, next) => {
        const {
            schema,
            username,
            password,
            dataPath,
            hostPort,
            type: dialect,
        } = ctx.request.body
        const { host, port } = hostPort || {}
        if (
            dialect === MiddlewareTypes.MySQL ||
            dialect === MiddlewareTypes.SQLite
        ) {
            const databaseService = new DatabaseService({
                schema,
                username,
                password,
                host,
                port,
                dialect,
                dataPath,
            })
            try {
                await databaseService.test()
                ctx.ok()
            } catch (error: any) {
                ctx.bizError(
                    ApplicationErrors.MiddlewareConnectFailed,
                    error.message
                )
            } finally {
                await databaseService.disconnect()
            }
        } else if (dialect === MiddlewareTypes.Redis) {
            ctx.bizError(ApplicationErrors.InvalidMiddlewareType)
        } else {
            ctx.bizError(ApplicationErrors.InvalidMiddlewareType)
        }
    },

    /**
     * 获取数据库表
     * @param ctx {NebulaKoaContext}
     * @param next
     * @returns {Promise<any>}
     */
    'get /cl-middleware/database/:id/tables': async (ctx, next) => {
        const id = ctx.getParam('id')
        const { name } = ctx.query
        const model = await ClMiddleware.getByPk(id)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const middlewareService = new DatabaseService(model)
        const result = await middlewareService.getDatabaseTables(name)

        ctx.ok(result)
    },

    // /**
    //  * 获取数据库表结构
    //  * @param ctx
    //  * @param next
    //  * @returns {Promise<any>}
    //  */
    // 'post /cl-middleware/database/:id/metadata': async (ctx, next) => {
    //     const id = ctx.getParam('id')
    //     const { tables = [], sequences = [] } = ctx.request.body
    //     const model = await ClMiddleware.getByPk(id)
    //     if (!model) {
    //         return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
    //     }
    //     const middlewareService = new DatabaseService(model.dataValues)
    //     const metadata = await middlewareService.getDatabaseMetadata(
    //         tables,
    //         sequences
    //     )
    //     ctx.ok(metadata)
    // },
}
