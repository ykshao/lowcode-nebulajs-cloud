import { NebulaErrors, QueryParser } from 'nebulajs-core'
import path from 'path'
import fs from 'fs'
import { Op } from 'sequelize'
import moment from 'moment'
import { AmisService } from '../../services/common/AmisService'
import { PageService } from '../../services/PageService'
import { ClPage } from '../../models/ClPage'

export = {
    /**
     * @swagger
     *
     * /app-page/schema/{id}:
     *   get:
     *     summary: 查询Nebula本地一个页面定义（读取本地代码）
     *     tags:
     *       - 页面
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: 页面ID
     *     responses:
     *       200:
     *         description: ok
     */
    'get /app-page/schema/:id': async function (ctx, next) {
        const id = ctx.getParam('id')
        const prefix = ctx.getParam('prefix')
        const schema = await PageService.readPageSchemaFromAppSource(id, prefix)
        ctx.ok(schema)
    },

    /**
     * @swagger
     *
     * /app-page:
     *   get:
     *     summary: 查询页面列表（分页）
     *     tags:
     *       - 页面
     *     parameters:
     *       - name: filter
     *         in: query
     *         required: false
     *         description: 过滤条件。支持两种格式：1.扁平格式 filter[字段][...外键字段][查询条件]=值；2.JSON格式（需要encodeURI） filter={"字段":{"外键字段":{"查询条件":"值"}}}
     *         example: filter[instance][app][name][eq]=asd 或 filter=encodeURI('{"instance":{"app":{"name":{"eq":"asd"}}}}')
     *       - name: include
     *         in: query
     *         required: false
     *         description: 关联外键。支持两种格式：1.扁平格式 include[外键字段][...外键字段]；2.JSON格式（需要encodeURI） include={"字段":{"外键字段":""}}}
     *         example: include[instance][app] 或 include=encodeURI('{"instance":{"app":""}}')
     *       - name: sort
     *         in: query
     *         required: false
     *         description: 排序。支持两种格式：1.扁平格式 sort[0][字段1]=asc&sort[0][字段2]=desc；2.JSON格式（需要encodeURI） sort=[{"字段1":"asc"},{"字段2":"asc"}]
     *         example: sort[0][port]=desc&sort[1][name]=asc 或 sort=encodeURI('[{"name":"asc"}]')
     *       - name: page
     *         in: query
     *         required: false
     *         description: 页码，从1开始
     *       - name: size
     *         in: query
     *         required: false
     *         description: 页大小，默认`20`
     *     responses:
     *       200:
     *         description: ok
     */
    'get /app-page': async function (ctx, next) {
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query)
        const offset = (page - 1) * size
        const { count, rows } = await ClPage.findAndCountAll({
            where: {
                [Op.or]: [{ appId: ctx.clientAppId }, { isSystem: true }],
            },
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
            attributes: {
                exclude: ['schema'],
            },
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },
}
