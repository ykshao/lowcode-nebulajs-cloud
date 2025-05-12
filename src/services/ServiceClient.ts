import axios from 'axios'
import crypto from 'crypto'

export default class ServiceClient {
    static create(serviceName, ctx) {
        const instance = axios.create({
            timeout: 10000,
        })
        instance.interceptors.request.use(
            (config) => {
                const instance = global.services[serviceName]
                if (instance.length === 0) {
                    throw new Error(`Can not find service of ${serviceName}.`)
                }

                // if (ctx && ctx.bearerAuth) {
                //     config.headers.setAuthorization(ctx.bearerAuth)
                // }

                const index = crypto.randomInt(0, instance.length)
                config.baseURL = instance[index].homePageUrl
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )
        instance.interceptors.response.use(
            (response) => {
                return response
            },
            (error) => {
                const res = error.response
                if (res && res.data && res.data.message) {
                    return Promise.reject(
                        new Error(
                            `request service [${serviceName}] error, status:${res.status}, message:${res.data.message}`
                        )
                    )
                } else if (res && res.statusText) {
                    return Promise.reject(
                        new Error(
                            `request service [${serviceName}] error, status:${res.status}, statusText:${res.statusText}`
                        )
                    )
                }
                return Promise.reject(error)
            }
        )
        return instance
    }
}
