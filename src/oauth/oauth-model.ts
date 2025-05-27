import moment from 'moment'
import bcrypt from 'bcryptjs'
import { Cache, DataStatus, OAuthGrantTypes } from '../config/constants'
import { OAuthError } from 'nebulajs-oauth2-server'
import { auth } from '../config/env'
import { AppUser } from '../models/AppUser'
import { ClApplication } from '../models/ClApplication'
import { UserService } from '../services/app/UserService'

const jwt = require('jsonwebtoken')

module.exports = {
    async generateAccessToken(client, user, scope) {
        const expiresAt = moment()
            .add(oAuthServer.options.accessTokenLifetime, 's')
            .toDate()

        // 验证已登录用户
        // if (user.login) {
        //     const { appId } = client
        //     const { AppUser } = nebula.sequelize.models
        //     const userCount = await AppUser.count({
        //         where: {
        //             login: user.login,
        //             appId,
        //         },
        //     })
        //     if (userCount === 0) {
        //         throw new OAuthError(
        //             `the user of name ${user.login} is not exist.`,
        //             { code: 403 }
        //         )
        //     }
        //     // user.name = appUser.dataValues.name
        // }
        const { privateKey, publicKey } = auth.nebulaConfig
        // console.log('privateKey, publicKey', privateKey, publicKey)
        const token = jwt.sign({ client, user, scope }, privateKey, {
            algorithm: 'RS256',
            expiresIn: oAuthServer.options.accessTokenLifetime,
        })
        return token
    },

    generateRefreshToken(client, user, scope) {
        const { privateKey, publicKey } = auth.nebulaConfig
        const expiresAt = moment()
            .add(oAuthServer.options.refreshTokenLifetime, 's')
            .toDate()
        const token = jwt.sign({ client, user, scope }, privateKey, {
            algorithm: 'RS256',
            expiresIn: oAuthServer.options.refreshTokenLifetime,
        })
        return token
    },

    async getClient(clientId, clientSecret, request) {
        console.log('getClient----------------', request.body, request.query)
        const { grant_type } = request.body
        if (grant_type && !OAuthGrantTypes.includes(grant_type)) {
            return null
        }
        const app = await ClApplication.getByUniqueKey('clientId', clientId)
        if (!app) {
            return null
        }

        // 放置app_id，getUser时用
        request.body.app_id = app.id

        return {
            id: clientId,
            code: app.code,
            appId: app.id, // Application主键
            // redirectUris: [],
            grants: OAuthGrantTypes,
        }
    },
    async getUser(username, password, request) {
        // console.log('getUser----------------', request.body, request.query)
        const { client_id, app_id } = request.body
        const user = await UserService.getUserByLoginAndAppId(app_id, username)
        if (!user || user.status !== DataStatus.ENABLED) {
            return null
        }
        if (!user.password) {
            throw new OAuthError(`the password of ${user.login} is invalid.`, {
                code: 401,
            })
        }
        const { login, password: hashPassword, id } = user
        const result = await bcrypt.compareSync(password, hashPassword)
        if (!result) {
            return null
        }

        return { login, id, name: user.name }
    },
    async saveToken(token, client, user) {
        // console.log('saveToken', token, client, user)
        return {
            ...token,
            client,
            user,
        }
    },

    async saveAuthorizationCode(code, client, user) {
        console.log('saveAuthorizationCode', code, client, user)
        const exp = moment(code.expiresAt).diff(moment(), 'second')
        console.log('saveAuthorizationCode', exp)
        await nebula.redis.setex(
            Cache.getAuthCodeKey(code.authorizationCode),
            exp,
            JSON.stringify({
                ...code,
                client,
                user,
            })
        )
        return {
            ...code,
            client,
            user,
        }
    },

    async revokeAuthorizationCode(code) {
        const key = Cache.getAuthCodeKey(code.code)
        await nebula.redis.del(key)
        return true
    },

    async getAuthorizationCode(authorizationCode) {
        const key = Cache.getAuthCodeKey(authorizationCode)
        const res = await nebula.redis.get(key)
        const authCode = JSON.parse(res)

        return {
            code: authorizationCode,
            ...JSON.parse(res),
            expiresAt: new Date(authCode.expiresAt),
        }
    },

    validateScope(user, client, scope) {
        console.log('validateScope:', user, client, scope)
        return scope
    },

    /**
     * client_credentials需要，可携带用户信息
     * @param client
     * @returns {Promise<{login}>}
     */
    async getUserFromClient(client) {
        console.log('getUserFromClient----------------', client)

        const login = client.login
        delete client.login
        return { login }
    },

    /**
     * AuthorizationCode方式
     * @param token
     */
    async getRefreshToken(token) {
        const { privateKey, publicKey } = auth.nebulaConfig
        const { client, user, scope, exp, iat } = await new Promise<any>(
            (resolve, reject) => {
                jwt.verify(
                    token,
                    publicKey,
                    { algorithms: ['RS256'] },
                    (err, decoded) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(decoded)
                        }
                    }
                )
            }
        )
        return {
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: new Date(exp * 1000),
            scope,
            client,
            user,
        }
    },

    revokeToken(token) {
        return true
    },

    /**
     * AuthorizationCode方式
     * @param token
     */
    async getAccessToken(token) {
        const { privateKey, publicKey } = auth.nebulaConfig
        const { client, user, scope, exp, iat } = await new Promise<any>(
            (resolve, reject) => {
                jwt.verify(
                    token,
                    publicKey,
                    { algorithms: ['RS256'] },
                    (err, decoded) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(decoded)
                        }
                    }
                )
            }
        )
        return {
            accessToken: token.accessToken,
            accessTokenExpiresAt: new Date(exp * 1000),
            scope,
            client,
            user,
        }
    },
}
