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
import { ClAppProfile } from './models/ClAppProfile'
import { ClApplication } from './models/ClApplication'
import { Agenda } from '@hokify/agenda'
import { JobService } from './services/JobService'
import { portalExtension } from './midwares/app-extension'
import { clientExtension } from './midwares/client-extension'
import { NebulaAppInitOptions } from 'nebulajs-core/lib/types/nebula'
import OAuth2Server from 'nebulajs-oauth2-server'

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
    // await app.sequelize.sync({ alter: true })

    // 初始化数据库
    await SystemService.initDatabase()

    // 装载应用配置
    await setupAppConfig(app)

    // 装载任务调度
    await setupScheduler()

    // Camunda 工作流任务监听
    SystemService.listenCamundaTasks()

    process.on('unhandledRejection', (reason, p) => {
        app.logger.error('unhandledRejection: %s', reason)
    })
    process.on('uncaughtException', (error) => {
        app.logger.error('uncaughtException: %s', error)
    })

    return app
}

async function setupScheduler() {
    if (!nebula.config.mongodb) {
        nebula.logger.error('未配置mongodb，无法启动任务调度。')
        return
    }
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
            `加载应用任务：APP:${job.attrs.data.appCode}, JOB:${
                job.attrs.name
            }, NAME:${job.attrs.data.name || ''}`
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
            const { env, app } = config
            const appConfig = await ApplicationService.loadAppConfig(config)
            await nebula.redis.set(
                Cache.getAppConfigKey(env, app.id),
                JSON.stringify(appConfig)
            )
        } catch (e) {
            nebula.logger.warn(
                `转换YAML文件件格式失败，应用CODE：${config.app.code}，原因：${e.message}`
            )
        }
    }
}

export { startup }
