import { NebulaKoaContext, NebulaErrors, QueryParser } from 'nebulajs-core'
import { Sequelize } from 'sequelize'
import { ModelService } from '../../services/ModelService'
import { ApplicationService } from '../../services/ApplicationService'
import { AuditModelProps } from '../../config/constants'
import { ClModel } from '../../models/ClModel'
import { ClModelProp } from '../../models/ClModelProp'
import { ClModelRef } from '../../models/ClModelRef'
import { ClMiddleware } from '../../models/ClMiddleware'

export = {
    /**
     * 查询模型
     * @param ctx {NebulaKoaContext}
     * @param next
     * @returns {Promise<void>}
     */
    'get /cl-model': async function (ctx, next) {
        const appId = ctx.appId
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await ClModel.findAndCountAll({
            where: {
                ...where,
                appId,
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
            distinct: true,
            include: [
                {
                    model: ClModelProp,
                    as: 'props',
                    attributes: ['id'],
                },
                {
                    model: ClModelRef,
                    as: 'refs',
                    attributes: ['id'],
                },
            ],
        })
        rows.map((m) => m.dataValues).forEach((m) => {
            // @ts-ignore
            m.propsCount = m.props.length
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    'get /cl-model/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const model = await ClModel.findByPk(id, {
            include: [
                {
                    model: ClModelProp,
                    as: 'props',
                    attributes: {
                        exclude: ['modelId', 'appId', ...AuditModelProps],
                    },
                },
                {
                    model: ClModelRef,
                    as: 'refs',
                    attributes: {
                        exclude: ['modelId', 'appId', ...AuditModelProps],
                    },
                },
            ],
            order: [[{ model: ClModelProp, as: 'props' }, 'name', 'asc']],
        })
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const data = model.dataValues
        // 去除系统自动填加的通用属性
        data.props = data.props.filter(
            (p) => ![...AuditModelProps, 'id'].includes(p.name)
        )
        ctx.ok(data)
    },

    'post /cl-model': async function (ctx, next) {
        const id = ctx.getParam('id')
        const appId = ctx.appId
        const body = { ...ctx.request.body, appId }

        let result
        if (id) {
            result = await ModelService.updateModel(body)
        } else {
            result = await ModelService.createModel(body)
        }
        ctx.ok(result)
    },

    'delete /cl-model/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        await ModelService.deleteModel(id)
        ctx.ok()
    },

    /**
     * 从数据库同步并生成Model
     * @param ctx
     * @param next
     * @returns {Promise<void>}
     */
    'post /cl-model/sync/from': async function (ctx, next) {
        ctx.checkRequired('middlewareId')
        const appId = ctx.appId
        const {
            tables = [],
            middlewareId,
            prefix,
            tablesConfig,
        } = ctx.request.body
        const database = await ClMiddleware.getByPk(middlewareId)
        if (!database) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        const count = await ModelService.syncFromDatabase(
            appId,
            database,
            tables,
            prefix,
            tablesConfig
        )
        ctx.ok({
            syncCount: count,
        })
    },

    /**
     * 将Model改动同步到数据库
     * @param ctx {NebulaKoaContext}
     * @param next
     * @returns {Promise<void>}
     */
    'post /cl-model/sync/to': async function (ctx, next) {
        ctx.checkRequired(['names', 'env'])
        const { names = [], env } = ctx.request.body
        const model = await ApplicationService.getCurrentApplication(ctx)
        if (!model) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        await ModelService.syncToDatabase(model, env, names)
        ctx.ok()
    },
}
