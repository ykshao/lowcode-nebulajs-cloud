import axios, { AxiosInstance, AxiosResponse } from 'axios'
import qs from 'querystring'
import { NebulaAxiosRequest } from 'nebulajs-core'
type GiteeEventType = {
    id: string
    type: string
    actor: {
        id: number
        login: string
        name: string
        avatar_url: string
    }
}
export class GiteeClient {
    private readonly request: AxiosInstance
    private readonly clientId: string
    private readonly clientSecret: string
    private readonly redirectURI: string

    public constructor({ baseURL, clientId, clientSecret, redirectURI }) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectURI = redirectURI
        this.request = new NebulaAxiosRequest({
            axiosOptions: {
                baseURL,
                timeout: 5 * 1000,
                responseType: 'json',
            },
            logger: nebula.logger,
            localServiceName: 'nebula-cloud',
            remoteServiceName: 'gitee',
            reqInterceptor: async (config) => {},
            resInterceptor: async (response) => {},
        }).toAxios()
    }

    private async get(url, params, retryCount = 2) {
        let res: AxiosResponse = null
        let times = 0
        let retry = false
        do {
            if (retry) {
                nebula.logger.info(`正在尝试重新请求，第 ${times} 次`)
            }
            try {
                res = await this.request.get(url, {
                    headers: {
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    params,
                })
                if (res.status !== 200) {
                    throw new Error(`http status: ${res.statusText}`)
                }
                return res.data
            } catch (e) {
                nebula.logger.error(
                    `fetch data error: ${e.message}, detail: ${res.statusText}`
                )
                if (times < retryCount) {
                    retry = true
                    times++
                } else {
                    retry = false
                }
            }
        } while (retry)
        return []
    }

    async getUserInfo(access_token) {
        const { data } = await this.request.get('/api/v5/user', {
            params: {
                access_token,
            },
        })
        return data
    }

    async getRepoLatestStarEvent(
        access_token,
        limit = 50
    ): Promise<GiteeEventType[]> {
        const params = {
            access_token,
            limit,
        }
        const list = await this.get(
            '/api/v5/repos/nebulajs/nebulajs-cloud/events',
            params
        )
        return list
            .filter((i) => i.type === 'StarEvent')
            .map((i) => {
                delete i.repo
                delete i.org
                delete i.payload
                delete i.created_at
                return i
            })
    }

    async getAccessToken({ url = '/oauth/token', code }) {
        const { data } = await this.request.post(
            url,
            {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectURI,
                code,
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )
        return data
    }
}
