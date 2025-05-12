import { NebulaErrors, NebulaKoaContext, QueryParser } from 'nebulajs-core'
import { InstanceService } from '../../services/InstanceService'
import { ClInstance } from '../../models/ClInstance'
import { Op } from 'sequelize'
import { DockerService } from '../../services/common/DockerService'
import { ClImage } from '../../models/ClImage'
import { ApplicationErrors } from '../../config/errors'
import { InstanceStatus } from '../../config/constants'
import stripAnsi from 'strip-ansi'
import iconv from 'iconv-lite'
export = {
    'get /cl-instance': async function (ctx, next) {
        const appId = ctx.appId
        const {
            where,
            order,
            page = 1,
            size = 20,
        } = QueryParser.parseFilter(ctx.request.query, ClInstance)
        const offset = (page - 1) * size
        const { count, rows } = await ClInstance.findAndCountAll({
            where: {
                ...where,
                appId,
                type: {
                    [Op.not]: 'vscode',
                },
            },
            // include: include,
            order,
            offset: offset < 0 ? 0 : offset,
            limit: size,
        })
        ctx.ok(rows)
        ctx.set('X-Total-Count', count)
    },

    'get /cl-instance/:id': async (ctx, next) => {
        const id = ctx.getParam('id')
        const instance = await ClInstance.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        ctx.ok(instance.dataValues)
    },

    'post /cl-instance/recreate/:id': async (ctx: NebulaKoaContext, next) => {
        const id = ctx.getParam('id')
        const imageId = ctx.getParam('imageId')
        ctx.checkRequired(['imageId'])
        const instance = await ClInstance.getByPk(id)
        const image = await ClImage.getByPk(imageId)
        if (!instance || !image) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        if (instance.version === image.version) {
            return ctx.bizError(ApplicationErrors.VersionIsSameAsInstance)
        }
        const newInstance = await InstanceService.switchVersion(instance, image)
        ctx.ok(newInstance.dataValues)
    },

    'get /cl-instance/log/:id': async (ctx: NebulaKoaContext, next) => {
        const id = ctx.getParam('id')
        const instance = await ClInstance.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const dockerService = new DockerService(instance.serverId)
        ctx.res.writeHead(200, {
            'Content-Type': 'text/plain',
            // 'Content-Type': 'application/vnd.docker.raw-stream',
            // Connection: 'upgrade',
            // Upgrade: 'tcp',
        })
        if (instance.status === InstanceStatus.STOPPED) {
            return ctx.res.end('Error')
        }
        await new Promise((resolve, reject) => {
            dockerService.getContainerLogById(
                instance.containerId,
                (err, stream) => {
                    if (err) {
                        // reject(err)
                        nebula.logger.warn('attach container error. %o', err)
                        ctx.res.end('Error')
                    } else {
                        // console.log(err, stream)
                        //处理流事件 -->data, end , and error
                        stream.on('data', function (chunk) {
                            // data  = chunk;
                            // console.log(iconv.decode(chunk, 'ascii'))
                            const data = stripAnsi(chunk.toString())
                            ctx.res.write(data)
                        })
                        stream.on('end', function () {
                            ctx.res.end()
                            nebula.logger.info(
                                'attach container end. id:' +
                                    instance.containerId
                            )
                            resolve({})
                        })
                        stream.on('error', function (err) {
                            nebula.logger.warn(
                                'attach container error. %o',
                                err
                            )
                            ctx.res.end('Error')
                        })
                        // stream.on('pause', function () {})
                        // stream.on('resume', function () {})
                        stream.on('close', function () {
                            ctx.res.end()
                            nebula.logger.info(
                                'attach container close. id:' +
                                    instance.containerId
                            )
                            resolve({})
                        })
                    }
                }
            )
        })
    },

    'get /cl-instance/start/:id': async (ctx, next) => {
        const id = ctx.getParam('id')
        const instance = await ClInstance.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const model = await InstanceService.startInstance(instance)
        ctx.ok(model.dataValues)
    },

    'get /cl-instance/stop/:id': async (ctx, next) => {
        const id = ctx.getParam('id')
        const instance = await ClInstance.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        await InstanceService.stopInstance(instance)
        ctx.ok()
    },

    'delete /cl-instance/:id': async (ctx, next) => {
        const id = ctx.getParam('id')
        const instance = await ClInstance.getByPk(id)
        if (!instance) {
            return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        await InstanceService.deleteInstance(instance)
        ctx.ok()
    },
}
