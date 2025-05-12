import { NebulaApp, NebulaAppConfig } from 'nebulajs-core'
import { Socket } from 'socket.io'
import { Agenda } from '@hokify/agenda'
declare global {
    /**
     * 定义必须用var
     */
    var nebula: NebulaApp & {
        socketMap: Map<string, Socket>
        scheduler: Agenda<any>
        oauth: any
    }

    var oAuthServer: {
        token: any
        options: any
    }
}
