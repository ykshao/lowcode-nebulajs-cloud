import path from 'path'
import fs from 'fs'
import ejs from 'ejs'
import { ApplicationService } from './ApplicationService'
import { Op } from 'sequelize'
import { AuthTypes } from '../config/constants'
import { ClMiddleware } from '../models/ClMiddleware'
import { ClInstance } from '../models/ClInstance'
import os from 'os'
export class ApplicationConfigService {
    static async getConfigContent({
        appId,
        databaseIns,
        redisIns,
        logLevel,
        env,
        authConfig,
    }) {
        const tplFolder = ApplicationService.getAppTemplatePath('base')
        const tpl = fs.readFileSync(path.join(tplFolder, 'config.ejs'))
        const sysConfig: any = {}

        if (databaseIns) {
            const model = await ClMiddleware.getByPk(databaseIns)
            sysConfig.database = model ? model.dataValues : undefined
        }
        if (redisIns) {
            const model = await ClMiddleware.getByPk(redisIns)
            sysConfig.redis = model ? model.dataValues : undefined
        }

        if (authConfig?.casConfig?.certificate) {
            // 证书回车转义
            authConfig.casConfig.certificate2 =
                authConfig.casConfig.certificate.replace(/\n/g, '\\n')
        }

        return ejs.render(
            tpl.toString(),
            {
                ...sysConfig,
                logLevel,
                authConfig,
            },
            {}
        )
    }
}
