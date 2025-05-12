import { NebulaBizError, BaseModel } from 'nebulajs-core'
import { ApiErrors } from '../config/errors'

import fs from 'fs'
import ejs from 'ejs'
import path from 'path'
import { ApplicationService } from './ApplicationService'
import decamelize from 'decamelize'
import camelCase from 'camelcase'
import { ClApi } from '../models/ClApi'
import { ClApplication } from '../models/ClApplication'

export class ApiService {
    /**
     *
     * @param body
     * @returns {Promise<BaseModel>}
     */
    static async updateApi(body) {
        const { id, path, method, appId } = body
        const found = await ClApi.findOne({
            where: {
                path,
                method,
                appId,
            },
        })
        if (found && found.dataValues.id !== id) {
            throw new NebulaBizError(ApiErrors.ApiPathExist)
        }

        let model = await ClApi.getByPk(id)
        model.set({ ...body, appId, isCustom: true })
        model = await model.save()

        return model
    }

    static async deleteApi(id) {
        const model = await ClApi.getByPk(id)
        const { path: apiPath, appId } = model.dataValues
        const { code: appCode } = (await ClApplication.getByPk(appId))
            .dataValues
        const apiFile = this.getApiFile(appCode, apiPath)

        // 删除API文件
        fs.existsSync(apiFile) && fs.unlinkSync(apiFile)

        await model.destroy()
    }

    /**
     * @param body
     * @returns {Promise<BaseModel>}
     */
    static async createApi(body) {
        const { path, method, appId } = body
        const [model, build] = await ClApi.findOrBuild({
            where: {
                path,
                method,
                appId,
            },
        })
        if (!build) {
            throw new NebulaBizError(ApiErrors.ApiPathExist)
        }

        model.set({ ...body, appId, isCustom: true })
        let newModel = await model.save()

        // 生成文件
        await this.generateApiFile(newModel)

        return newModel
    }

    /**
     * 获取API文件路径
     * @param appCode
     * @param apiPath
     * @param apiFolderPath
     * @returns {string}
     */
    static getApiFile(appCode, apiPath, apiFolderPath = './routers/api') {
        const apiFolder = path.join(
            ApplicationService.getAppDataSrcPath(appCode),
            apiFolderPath
        )
        const apiBaseName = apiPath
            .split(/\//)
            .filter((s) => s)
            .map((s) => {
                return camelCase(s, { pascalCase: true })
            })
            .join('')
        const apiFilename = `${apiBaseName}Api.js`
        return path.join(apiFolder, apiFilename)
    }

    /**
     * 生成API文件
     * @param apiModel {BaseModel}
     * @param apiFolderPath
     * @returns {Promise<void>}
     */
    static async generateApiFile(apiModel: ClApi, apiFolderPath?) {
        const tplFolder = ApplicationService.getAppTemplatePath('base')
        const tpl = fs.readFileSync(path.join(tplFolder, 'api.ejs'))
        const { method, path: apiPath, appId } = apiModel.dataValues
        const { code: appCode } = (await ClApplication.getByPk(appId))
            .dataValues
        const parameters = JSON.parse(apiModel.dataValues.parameters || '[]')
        const responses = JSON.parse(apiModel.dataValues.responses || '{}')
        const text = ejs.render(
            tpl.toString(),
            {
                fn_decamelize: (str) => decamelize(str, { separator: '-' }),
                ...apiModel.dataValues,
                parameters,
                responses,
            },
            {}
        )

        const restApiFile = this.getApiFile(appCode, apiPath, apiFolderPath)
        nebula.logger.info(`生成Api文件：${restApiFile}`)
        fs.writeFileSync(restApiFile, text)
    }
}
