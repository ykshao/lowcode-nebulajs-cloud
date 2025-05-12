import { NebulaBizError, NebulaErrors } from 'nebulajs-core'
import path from 'path'
import fs from 'fs'
import { AmisService } from './common/AmisService'
import { ClPage } from '../models/ClPage'
import { ClApplication } from '../models/ClApplication'
import { ApplicationService } from './ApplicationService'
import { GitService } from './common/GitService'
import { ApplicationErrors, ProcessErrors } from '../config/errors'
import { Op } from 'sequelize'
import { AppUtil } from '../utils/app-util'
import { CommonUtil } from '../utils/common-util'

export class PageService {
    static getSchemaPath(model: ClPage, appModel: ClApplication): string {
        if (!model.schemaFile) {
            return null
        }
        let appRootPath = path.join(__dirname, '../../')
        // 不是内置页面
        if (!model.isInternal) {
            appRootPath = ApplicationService.getAppDataSrcPath(appModel.code)
        }
        return path.join(appRootPath, `static/schema`, model.schemaFile)
    }

    static async syncForms(
        model: ClPage,
        { sourceFormType, syncCreate, syncUpdate, syncDetail }
    ) {
        const appModel = await ClApplication.getByPk(model.appId)
        const schemaFilePath = PageService.getSchemaPath(model, appModel)
        const schemaText = fs.readFileSync(schemaFilePath).toString()
        const schema = JSON.parse(schemaText)
        const forms = AmisService.findElementsByTypes(schema, ['form'])
        if (forms.length === 0) {
            throw new NebulaBizError(ApplicationErrors.PageFormNotFound)
        }
        const createForm = forms.filter((f) => f.api?.method === 'post')[0]
        const updateForm = forms.filter((f) => f.api?.method === 'put')[0]
        const detailForm = forms.filter((f) => !f.api)[0]
        let srcForm = null
        if (sourceFormType === 'create') {
            if (!createForm) {
                throw new NebulaBizError(ApplicationErrors.PageFormNotFound)
            }
            srcForm = createForm
        } else if (sourceFormType === 'update') {
            if (!updateForm) {
                throw new NebulaBizError(ApplicationErrors.PageFormNotFound)
            }
            srcForm = updateForm
        }

        if (syncCreate) {
            createForm.body = JSON.parse(JSON.stringify(srcForm)).body
        }

        if (syncUpdate) {
            updateForm.body = JSON.parse(JSON.stringify(srcForm)).body
        }

        if (syncDetail) {
            detailForm.body = JSON.parse(JSON.stringify(srcForm)).body
            // 生成新的ID
            AmisService.generateNewNodeId(detailForm)
            const inputTypes = [
                'input-text',
                'input-number',
                'input-file',
                'input-year',
                'input-date',
                'input-datetime',
                'input-date-range',
                'input-datetime-range',
                'select',
                'switch',
                'textarea',
                'checkboxes',
                'button-group-select',
            ]
            const inputs = AmisService.findElementsByTypes(
                detailForm,
                inputTypes
            )
            inputs.forEach((i) => {
                i.disabled = true
                i.className = i.className
                    ? +`${i.className} nb-disabled`
                    : 'nb-disabled'
            })
            const selects = AmisService.findElementsByTypes(detailForm, [
                'select',
            ])
            selects.forEach((i) => {
                i.clearable = false
            })
        }

        nebula.logger.info(`保存页面定义到文件：${schemaFilePath}`)
        fs.writeFileSync(schemaFilePath, JSON.stringify(schema, null, 4))
    }

    static async createPage(appModel: ClApplication, body: ClPage) {
        const count = await ClPage.count({
            where: {
                [Op.or]: [
                    {
                        appId: appModel.id,
                        url: body.url,
                    },
                    {
                        isInternal: true,
                        url: body.url,
                    },
                ],
            },
        })
        if (count > 0) {
            throw new NebulaBizError(ApplicationErrors.PageUrlExist)
        }

        const appSrcPath = ApplicationService.getAppDataSrcPath(appModel.code)
        const schemaFileRelPath = this.writePageSchemaFile(
            appSrcPath,
            body.url,
            body.schema || '{}'
        )

        const created = await ClPage.create({
            ...body,
            appId: appModel.id,
            schemaFile: schemaFileRelPath,
        })
        return created.dataValues
    }

    /**
     *
     * @param appSrcPath
     * @param pageUrl
     * @param schema
     * @return path schemaFile relative path
     */
    static writePageSchemaFile(
        appSrcPath: string,
        pageUrl: string,
        schema: string
    ) {
        const filenameIndex = pageUrl.lastIndexOf('/')
        const schemaFile =
            pageUrl.substring(filenameIndex + 1, pageUrl.length) + '.json'
        const schemaFolder = pageUrl.substring(0, filenameIndex)
        const schemaFolderPath = path.join(
            appSrcPath,
            'static/schema',
            schemaFolder
        )
        // 自动创建文件夹
        !fs.existsSync(schemaFolderPath) &&
            fs.mkdirSync(schemaFolderPath, { recursive: true })
        // 写入文件
        fs.writeFileSync(path.join(schemaFolderPath, schemaFile), schema)
        return path.join(schemaFolder, schemaFile)
    }

    /**
     * 获取页面定义
     * 注：只能获取Nebula平台上存放的应用代码，不能用于应用页面加载
     *
     * @param id
     * @param prefix 替换api前缀
     * @returns {Promise<any>}
     */
    static async readPageSchemaFromAppSource(id, prefix?: string) {
        const model = await ClPage.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }
        const appModel = await ClApplication.getByPk(model.appId)
        const schemaFilePath = this.getSchemaPath(model, appModel)
        let schemaText = '{}'
        if (fs.existsSync(schemaFilePath)) {
            nebula.logger.info(`读取页面定义文件：${schemaFilePath}`)
            schemaText = fs.readFileSync(schemaFilePath).toString()
        }
        // else if (model.schema) {
        //     // 兼容旧版本
        //     nebula.logger.info(`读取数据库页面定义：${model.url}`)
        //     schemaText = model.schema
        // }
        else {
            throw new NebulaBizError(ApplicationErrors.PageSchemaNotFound)
        }

        // 替换api前缀
        if (prefix) {
            schemaText = AmisService.replaceApiPathWithPrefix(
                schemaText,
                prefix
            )
        }
        return JSON.parse(schemaText)
    }

    static async lockPage(model: ClPage, userLogin: string) {
        if (model.lockedBy && model.lockedBy !== userLogin) {
            throw new NebulaBizError(ApplicationErrors.PageLocked)
        }
        model.set({ lockedBy: userLogin })
        await model.save()
    }

    static async deletePage(model: ClPage) {
        const appModel = await ClApplication.getByPk(model.appId)
        const transaction = await nebula.sequelize.transaction()

        try {
            await model.destroy({ transaction })
            const schemaFilePath = this.getSchemaPath(model, appModel)
            nebula.logger.info(`删除页面定义到文件：${schemaFilePath}`)
            fs.existsSync(schemaFilePath) && fs.unlinkSync(schemaFilePath)
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            throw e
        }
    }

    /**
     * 保存页面定义
     * @param id
     * @param schema
     * @param login
     * @returns {Promise<void>}
     */
    static async savePageSchema(id: string, schema: string, login: string) {
        const model = await ClPage.getByPk(id)
        if (!model) {
            throw new NebulaBizError(NebulaErrors.BadRequestErrors.DataNotFound)
        }

        // 页面被其他人锁定
        if (model.lockedBy && model.lockedBy !== login) {
            throw new NebulaBizError(ApplicationErrors.PageLocked)
        }

        // 不允许其他应用修改内置页面，只有nebula应用可以
        const appModel = await ClApplication.getByPk(model.appId)
        const isNebulaApp = AppUtil.isNebulaApp(appModel.code)
        if (model.isInternal && !isNebulaApp) {
            throw new NebulaBizError(ApplicationErrors.PageCannotBeModified)
        }

        const schemaFilePath = this.getSchemaPath(model, appModel)
        nebula.logger.info(`保存页面定义到文件：${schemaFilePath}`)
        fs.writeFileSync(
            schemaFilePath,
            JSON.stringify(JSON.parse(schema), null, 4)
        )

        // 提交git
        // await ApplicationService.commitAppCode(
        //     appModel,
        //     login,
        //     `fix: 修改页面定义[${model.name}]`
        // )
        model.set({ lockedBy: null })
        await model.save()
    }
}
