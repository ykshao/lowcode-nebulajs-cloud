import { DockerWorker } from './module/DockerWorker'
import { ApplicationService } from '../services/ApplicationService'
import { ClApplication } from '../models/ClApplication'
import { GitService } from '../services/common/GitService'
import { servers } from '../config/env'

export = async ({
    app,
    image,
    version,
}: { app: ClApplication } & Partial<any>) => {
    const appSrcFolder = ApplicationService.getAppDataSrcPath(app.code)
    const server = servers[app.serverId]
    // console.log('server', server)
    // 打包
    const dockerWorker = new DockerWorker(server)
    await dockerWorker.buildImage({
        appSrcFolder,
        name: app.code,
        version,
    })

    // git 打标签
    if (version !== 'latest') {
        const gitService = new GitService(appSrcFolder)
        await gitService.tag(version)
    }
}
