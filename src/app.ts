import {
    NebulaApp,
    AccessManager,
    Constants,
    authExtension,
    cloudExtension,
} from 'nebulajs-core'
import path from 'path'
import { ApplicationService } from './services/ApplicationService'
import { SystemService } from './services/SystemService'
import { Cache, Cookies, DataStatus, OAuthGrantTypes } from './config/constants'
import { whitePathList } from './config/security'
import { getNamespace, createNamespace } from 'continuation-local-storage'
import { CamundaTaskListener } from './jobs/camunda-task-listener'
import { MessageService } from './services/app/MessageService'
import { ClAppProfile } from './models/ClAppProfile'
import { ClApplication } from './models/ClApplication'
import { ClPage } from './models/ClPage'
import { Agenda } from '@hokify/agenda'
import { JobService } from './services/JobService'
import { Op } from 'sequelize'
import { portalExtension } from './midwares/app-extension'
import { clientExtension } from './midwares/client-extension'
import { NebulaAppInitOptions } from 'nebulajs-core/lib/types/nebula'
import OAuth2Server from 'nebulajs-oauth2-server'
import { AppProcessDef } from './models/AppProcessDef'
import { CamundaService } from './services/common/CamundaService'

const pkg = require('../package.json')
const config = require('./config/env')
const options: NebulaAppInitOptions = {
    id: pkg.nebula.id,
    clientId: pkg.nebula.clientId,
    clientSecret: pkg.nebula.clientSecret,
    serviceURL: config.app.serviceURL,
    wsServiceURL: config.app.wsServiceURL,
    name: pkg.name,
    version: pkg.version,
    config: config,
    modelPath: path.join(__dirname, './models'),
    viewsPath: path.resolve('./views'),
    jobPath: path.join(__dirname, './jobs'),
    controllers: [
        { path: path.join(__dirname, './routers/api'), prefix: '/api' },
        {
            path: path.join(__dirname, './routers/app'),
            prefix: '/app',
        },
        {
            path: path.join(__dirname, './routers/portal'),
            prefix: '/portal',
        },
        {
            path: path.join(__dirname, './routers/root'),
            prefix: '/',
        },
    ],
}

async function startup(port) {
    const app = await NebulaApp.getInstance(options)

    // koaProxy中间件必须在bodyParser之前，否则POST请求无法返回
    // 租户应用系统功能页面直接访问（系统管理、流程等），代理到云端/app接口
    // app.middlewares.unshift(
    //     cloudExtension({
    //         logger: app.logger,
    //         routePath: '/cloud',
    //         target: `http://localhost:${port}`,
    //     })
    // )

    // Portal统一权限拦截（/api,/cloud除外）
    // JWT Nebula云应用证书验证用户token
    app.middlewares.push(
        authExtension({
            logger: app.logger,
            routePath: '/',
            accessManager: new AccessManager({
                whitePathList: [...whitePathList, '* /api'],
                // whitePathList,
            }),
            accessTokenCookieName: Cookies.ACCESS_TOKEN,
            refreshTokenCookieName: Cookies.REFRESH_TOKEN,
        })
    )

    app.middlewares.push(
        cloudExtension({ logger: app.logger, routePath: '/cloud' })
    )

    // Nebula平台API，接收租户应用请求（SDK请求、租户端系统页面请求）
    // 验证租户签名，可能存在A系统用户，携带B系统的请求头访问
    // TODO 安全问题，一个系统的管理员可以重置别一个系统的用户密码
    // 理论上不可以，cloud接口都是通过sdk调用
    app.middlewares.push(
        clientExtension({ logger: app.logger, routePath: ['/api', '/app'] })
    )

    // Portal选择应用拦截
    app.middlewares.push(
        portalExtension({ logger: app.logger, routePath: '/portal' })
    )

    // OAuth Server
    global.oAuthServer = new OAuth2Server({
        model: require('./oauth/oauth-model'),
        grantType: OAuthGrantTypes,
        allowBearerTokensInQueryString: true,
        debug: true,
        ...(app.config.auth.nebulaConfig || {}),
    })

    // 启动
    await app.startup({ port })
    // await app.sequelize.models.AppUser.sync({ alter: true })
    // await app.sequelize.models.ClJobExecution.sync({ alter: true })
    // await app.sequelize.sync({ alter: true })

    // 初始化数据库
    await SystemService.initDatabase()

    // 装载任务调度
    await setupScheduler()

    // 装载应用配置
    await setupAppConfig(app)

    // Camunda 工作流监听
    CamundaTaskListener.listenUnHandledTask(async (task) => {
        nebula.logger.debug('listenUnHandledTask callback =====> %o', task)
        // event事件（create, complete, delete, timeout）
        const { event, processDefinitionId: definitionId } = task

        // 删除通知标志
        await CamundaService.deleteHistoryVariable(task.variableId)

        // 获取流程定义
        const processDefinition = await CamundaService.getProcessDefinition(
            definitionId
        )
        const { appId, envs = '' } = await AppProcessDef.getByUniqueKey(
            'camundaProcessId',
            definitionId
        )

        // 向所有环境发送应用消息
        for (const env of envs.split(',')) {
            // 向租户应用发送消息，租户收到消息后做一些处理
            MessageService.sendClientProcessMessage(event, appId, env, {
                ...task,
                processDefinition,
            })
        }

        // 发送站内流程消息
        await MessageService.sendAppUserTaskMessage(
            appId,
            task,
            processDefinition,
            event
        )
    })

    process.on('unhandledRejection', (reason, p) => {
        app.logger.error('unhandledRejection: %s', reason)
    })
    process.on('uncaughtException', (error) => {
        app.logger.error('uncaughtException: %s', error)
    })

    return app
}

async function setupScheduler() {
    const mongoConnectionString =
        nebula.config.mongodb.uri +
        '/' +
        nebula.config.mongodb.options.dbName +
        '?authSource=admin'
    nebula.scheduler = new Agenda({
        db: {
            address: mongoConnectionString,
            collection: 'agendaJobs',
            options: {},
        },
    })
    // this.scheduler.on('start', this.sdk.schedule.onAgendaJobStarting)
    // this.scheduler.on('success', this.sdk.schedule.onAgendaJobSuccess)
    // this.scheduler.on('fail', this.sdk.schedule.onAgendaJobFail)

    // agenda启动
    await nebula.scheduler.start()

    // 加载jobs
    const jobs = await nebula.scheduler.jobs({})
    for (const job of jobs) {
        nebula.logger.info(
            `加载Job，应用CODE：${job.attrs.data.appCode}，Job：${job.attrs.name}`
        )
        JobService.defineRemoteJob(job.attrs.name)
    }
}

/**
 * 装载应用配置
 * @param instance {NebulaApp}
 * @returns {Promise<void>}
 */
async function setupAppConfig(instance) {
    const configList = await ClAppProfile.findAll({
        include: {
            model: ClApplication,
            as: 'app',
            where: { status: DataStatus.ENABLED },
        },
    })
    for (const config of configList) {
        try {
            await ApplicationService.setupCloudConfig(config)
        } catch (e) {
            nebula.logger.warn(
                `转换YAML文件件格式失败，应用CODE：${config.app.code}，原因：${e.message}`
            )
        }
    }
}

export { startup }
