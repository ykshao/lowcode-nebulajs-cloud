import { DockerService } from './common/DockerService'
import { InstanceStatus, MiddlewareTypes } from '../config/constants'
import { ApplicationService } from './ApplicationService'
import { BaseModel, NebulaBizError } from 'nebulajs-core'
import { Transaction } from 'sequelize'
import { ClInstance } from '../models/ClInstance'
import { ClApplication } from '../models/ClApplication'
import { ClAppInfo } from '../models/ClAppInfo'
import randomstring from 'randomstring'
import { app } from '../config/env'
import { ClImage } from '../models/ClImage'

const { serviceURL, wsServiceURL } = app
export class InstanceService {
    /**
     * 启动实例
     * @param {BaseModel} instance
     * @param {Transaction} [transaction]
     * @returns {Promise<BaseModel>}
     */
    static async startInstance(instance: ClInstance, transaction?) {
        const { type, appId, dockerFile } = instance
        const app = await ClApplication.getByPk(appId)
        const { code, serverId } = app
        const dockerService = new DockerService(instance.serverId)
        const composeFile = ApplicationService.getComposeFilePath(
            code,
            type,
            dockerFile
        )

        if (type === 'vscode') {
            //VSCODE需要重新生成compose文件刷新密码
            const vsCodePassword = randomstring.generate(16)
            await ClAppInfo.update(
                { vsCodePassword },
                { where: { appId: app.id }, transaction }
            )
            ApplicationService.generateComposeFile(instance, composeFile, {
                vsCodePassword,
                serviceURL,
                wsServiceURL,
            })
        } else {
        }

        // 启动docker实例
        const { id: containerId } = await dockerService.startContainer(
            composeFile,
            code
        )
        instance.set({
            containerId,
            status: InstanceStatus.STARTED,
        })
        return await instance.save({ transaction })
    }

    /**
     * 停止容器
     * @param instance {BaseModel}
     * @param {Transaction} [transaction]
     * @returns {Promise<void>}
     */
    static async stopInstance(instance: ClInstance, transaction?) {
        const { containerId, app } = instance
        const dockerService = new DockerService(instance.serverId)
        await dockerService.stopContainerById(containerId)
        instance.set({
            status: InstanceStatus.STOPPED,
        })
        await instance.save({ transaction })
    }

    /**
     * 删除容器
     * @param instance {BaseModel}
     * @param {Transaction} [transaction]
     * @returns {Promise<void>}
     */
    static async deleteInstance(instance: ClInstance, transaction?) {
        const { containerId, app } = instance
        const dockerService = new DockerService(instance.serverId)
        if (containerId) {
            await dockerService.deleteContainerById(containerId)
        }
        await instance.destroy({ transaction })
    }

    static async switchVersion(
        instance: ClInstance,
        image: ClImage
    ): Promise<ClInstance> {
        const dockerService = new DockerService(instance.serverId)
        const transaction = await nebula.sequelize.transaction()
        let newIns = null
        try {
            await dockerService.stopContainerById(instance.containerId)
            await dockerService.deleteContainerById(instance.containerId)

            // 更新版本号
            instance.set({
                version: image.version,
                containerId: null,
                status: InstanceStatus.STOPPED,
            })

            // 重新生成docker-compose文件
            const composeFilePath = ApplicationService.getComposeFilePath(
                instance.app.code,
                instance.type,
                instance.dockerFile
            )
            ApplicationService.generateComposeFile(instance, composeFilePath, {
                serviceURL,
                wsServiceURL,
            })

            newIns = await instance.save()
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            throw e
        }
        return newIns
    }
}
