import {
    CookieNames,
    NebulaBizError,
    NebulaErrors,
    NebulaKoaContext,
} from 'nebulajs-core'
import { AuthUtils, CommonUtils } from 'nebulajs-core/lib/utils'
import { AuthenticateErrors } from 'nebulajs-core/lib/error/def'
import path from 'path'
import fs from 'fs'
const pkg = require('../../package.json')
export = {
    'get /': async (ctx, next) => {
        const currApp = await nebula.sdk.application.getApplication()
        const headbar = ctx.getParam('headbar')
            ? CommonUtils.parseBoolean(ctx.getParam('headbar'))
            : true
        const sidebar = ctx.getParam('sidebar')
            ? CommonUtils.parseBoolean(ctx.getParam('sidebar'))
            : true
        await ctx.render('index', {
            id: nebula.id,
            name: currApp.name,
            logo: currApp.logo,
            version: pkg.version,
            env: nebula.env,
            setting: {
                hideNav: !sidebar,
                hideHeader: !headbar,
                hideBreadCrumbs: !headbar,
            },
        })
    },

    'get /login': async (ctx, next) => {
        const authType = nebula.config.auth.authType
        const { redirect = '' } = ctx.request.query
        if (authType === 'cas') {
            const baseUrl = `${ctx.protocol}://${ctx.host}/oauth/callback/cas`
            const signInUrl = nebula.cas.getSignInUrl(
                encodeURIComponent(`${baseUrl}?redirect=${redirect}`)
            )
            ctx.redirect(signInUrl)
        } else if (authType === 'nebula') {
            await ctx.render('login', {
                id: nebula.id,
                name: nebula.name,
                version: nebula.version,
                redirect,
                setting: {
                    hideNav: true,
                    hideHeader: false,
                    hideBreadCrumbs: true,
                    hideHeaderBar: true,
                    translucentHeader: true,
                },
            })
        } else {
            throw new NebulaBizError(AuthenticateErrors.AccessForbidden)
        }
    },

    'post /auth/login': async (ctx, next) => {
        ctx.checkRequired(['username', 'password'])
        const { username, password, rememberMe, redirect } = ctx.request.body
        let loginRes = null
        try {
            loginRes = await nebula.sdk.auth.sendPasswordGrant(
                username,
                password
            )
        } catch (e) {
            if (e.status === 403) {
                throw new NebulaBizError(
                    NebulaErrors.AuthenticateErrors.AccessForbidden,
                    e.message
                )
            }
            throw new NebulaBizError(
                NebulaErrors.AuthenticateErrors.InvalidUsernameOrPassword,
                e.message
            )
        }

        nebula.logger.info('登录结果：%o', loginRes)

        // 登陆完成
        const { access_token, refresh_token } = loginRes
        ctx.cookies.set(CookieNames.AccessToken, access_token, {
            path: '/',
            httpOnly: false,
        })
        ctx.cookies.set(CookieNames.RefreshToken, refresh_token, {
            path: '/',
            httpOnly: false,
        })
        ctx.ok({ ...loginRes, redirect })
    },

    'get /auth/logout': async function (ctx, next) {
        ctx.cookies.set(CookieNames.AccessToken, null)
        ctx.cookies.set(CookieNames.RefreshToken, null)
        ctx.ok({ loginURL: '/login' })
    },

    'get /oauth/callback/cas': async (ctx, next) => {
        // state为SDK初始化时设置的appName，此处为appId
        const { code, state, redirect = '' } = ctx.request.query
        ctx.type = 'text/html; charset=utf-8'
        try {
            // state验证
            if (!state || state !== nebula.name) {
                throw new Error('application id is not matched.')
            }
            const { access_token, refresh_token } =
                await nebula.cas.getAuthToken(code)

            // 验证用户应用权限
            const { user } = AuthUtils.parseCasJwtToken(access_token)
            const userModel = await nebula.sdk.user.getUserByLogin(user.login)
            if (!userModel) {
                throw new NebulaBizError(AuthenticateErrors.AccessForbidden)
            }

            ctx.cookies.set(CookieNames.AccessToken, access_token, {
                path: '/',
                httpOnly: false,
            })
            ctx.cookies.set(CookieNames.RefreshToken, refresh_token, {
                path: '/',
                httpOnly: false,
            })
            ctx.redirect(redirect || '/')
        } catch (e) {
            nebula.logger.warn('Cas callback error. %o', e)
            throw new NebulaBizError(
                NebulaErrors.AuthenticateErrors.AccessForbidden,
                e.message
            )
        }
    },
}
