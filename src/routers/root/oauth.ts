import { ParameterizedContext } from 'koa'
import { NebulaBizError, NebulaErrors } from 'nebulajs-core'
import { UserService } from '../../services/app/UserService'
import { UserErrors } from '../../config/errors'
import { ClApplication } from '../../models/ClApplication'
import { OAuthError, Request, Response } from 'nebulajs-oauth2-server'
import { auth } from '../../config/env'

module.exports = {
    'get /oauth/token_key': async (ctx, next) => {
        const { privateKey, publicKey } = auth.nebulaConfig
        ctx.body = {
            alg: 'SHA256withRSA',
            value: publicKey,
        }
    },

    /**
     *
     * @param ctx {ParameterizedContext}
     * @param next
     * @returns {Promise<void>}
     */
    '/oauth/token': async (ctx, next) => {
        const request = new Request(ctx.request)
        const response = new Response(ctx.response)
        try {
            const res = await oAuthServer.token(request, response, {})
            const { accessToken, refreshToken, scope, client, user } = res
            ctx.body = {
                access_token: accessToken,
                expires_in: oAuthServer.options.accessTokenLifetime,
                refresh_token: refreshToken,
                token_type: 'bearer',
                scope: scope,
                client,
                user,
            }
        } catch (e) {
            if (e instanceof OAuthError) {
                if (e.code === 403) {
                    throw new NebulaBizError(
                        NebulaErrors.AuthenticateErrors.AccessForbidden,
                        e.message
                    )
                }
            }
            throw e
        }
    },

    //
    // // '/oauth/authenticate': async (ctx, next) => {
    // //     const request = new Request(ctx.request)
    // //     const response = new Response(ctx.response)
    // //     const { oauth } = nebula
    // //
    // //     try {
    // //         const res = await oauth.authenticate(request, response, {})
    // //         ctx.body = res
    // //     } catch (e) {
    // //         if (e instanceof OAuthError) {
    // //             throw new NebulaBizError(
    // //                 NebulaErrors.AuthenticateErrors.Common,
    // //                 e.message
    // //             )
    // //         }
    // //         throw e
    // //     }
    // // },

    // 'post /oauth/authorize': async (ctx, next) => {
    //     const request = new Request(ctx.request)
    //     const response = new Response(ctx.response)
    //     const { oauth } = nebula
    //     try {
    //         const res = await oauth.authorize(request, response, {})
    //         const { authorizationCode, redirectUri } = res
    //         const url = new URL(redirectUri)
    //         url.searchParams.append('code', authorizationCode)
    //         ctx.redirect(url.href)
    //     } catch (e) {
    //         console.error(e)
    //         if (e instanceof OAuthError) {
    //             throw new NebulaBizError(
    //                 NebulaErrors.AuthenticateErrors.Common,
    //                 e.message
    //             )
    //         }
    //         throw e
    //     }
    // },
    //
    // /**
    //  *
    //  * @param ctx {ParameterizedContext}
    //  * @param next
    //  * @returns {Promise<*>}
    //  */
    // 'get /oauth/authorize': async (ctx, next) => {
    //     // Redirect anonymous users to login page.
    //     ctx.checkRequired(['client_id', 'redirect_uri'])
    //     // if (!ctx.state.user) {
    //     //     return ctx.redirect(
    //     //         util.format(
    //     //             '/login?redirect=%s&client_id=%s&redirect_uri=%s',
    //     //             ctx.request.path,
    //     //             ctx.request.query.client_id,
    //     //             ctx.request.query.redirect_uri
    //     //         )
    //     //     )
    //     // }
    //
    //     // 查询应用
    //     const { ClApplication } = nebula.sequelize.models
    //     const model = await ClApplication.getByUniqueKey(
    //         'clientId',
    //         ctx.request.query.client_id.toString()
    //     )
    //     if (!model) {
    //         return ctx.bizError(NebulaErrors.BadRequestErrors.DataNotFound)
    //     }
    //
    //     await ctx.render('authorize', {
    //         id: pkg.id,
    //         name: pkg.name,
    //         version: pkg.version,
    //         setting: {
    //             hideNav: true,
    //             hideHeader: false,
    //             hideBreadCrumbs: true,
    //             hideHeaderBar: true,
    //             translucentHeader: true,
    //         },
    //         client_logo: model.dataValues.logo,
    //         client_name: model.dataValues.name,
    //         client_id: ctx.request.query.client_id,
    //         redirect_uri: ctx.request.query.redirect_uri,
    //         oauth_state: ctx.request.query.state,
    //         oauth_scope: ctx.request.query.scope,
    //         access_token: ctx.getCookieParam(CookieName.AccessToken),
    //         refresh_token: ctx.getCookieParam(CookieName.RefreshToken),
    //     })
    // },
}
