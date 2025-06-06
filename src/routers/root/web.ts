import { Cookies, DataStatus } from '../../config/constants'
import { NebulaBizError, NebulaKoaContext } from 'nebulajs-core'
import fs from 'fs'
import path from 'path'
import { AuthenticateErrors } from 'nebulajs-core/lib/error/def'
import { ClApplication } from '../../models/ClApplication'

module.exports = {
    'get /': async (ctx, next) => {
        await ctx.render('index', {
            id: nebula.id,
            name: nebula.name,
            version: nebula.version,
            setting: {
                hideNav: true,
                hideBreadCrumbs: true,
            },
        })
    },

    'get /login': async (ctx: NebulaKoaContext, next) => {
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

    'get /console': async (ctx, next) => {
        const { rows } = await ClApplication.findAndCountAll({
            where: {
                status: DataStatus.ENABLED,
            },
            order: [['createdAt', 'desc']],
            limit: 8,
        })
        const appId =
            ctx.cookies.get(Cookies.CURRENT_APP_ID) ||
            ctx.getParam(Cookies.CURRENT_APP_ID)
        if (!appId) {
            return ctx.redirect('/#/')
        }
        const appModel = await ClApplication.getByPk(appId)
        if (!appModel) {
            return ctx.redirect('/#/')
        }
        await ctx.render('console', {
            id: nebula.id,
            name: nebula.name,
            version: nebula.version,
            setting: {},
            apps: rows,
            currentApp: appModel.dataValues,
            docURL: 'https://docs.nebulajs.com/',
        })
    },
}
