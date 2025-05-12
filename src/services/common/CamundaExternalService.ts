import { Client } from 'camunda-external-task-client-js'

export class CamundaExternalService {
    static _instance

    /**
     * @type {Client}
     */
    externalClient

    constructor(options: { baseUrl: string; use }) {
        this.externalClient = new Client(options)
    }

    static getInstance(options) {
        if (!this._instance) {
            this._instance = new CamundaExternalService(options)
        }
        return this._instance
    }

    start() {
        // this.externalClient.subscribe()
        // (new Client({})).
    }
}
