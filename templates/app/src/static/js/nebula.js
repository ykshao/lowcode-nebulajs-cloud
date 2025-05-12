const nbAmis = { adaptors: {} }
nbAmis.adaptors.commonList = function (payload, response) {
    return {
        items: payload.data,
        total: response.headers['x-total-count'],
    }
}
nbAmis.initHashHistory = function () {
    const match = amisRequire('path-to-regexp').match

    // 如果想用 browserHistory 请切换下这处代码, 其他不用变
    // const history = History.createBrowserHistory();
    const history = History.createHashHistory()

    function normalizeLink(to, location = history.location) {
        to = to || ''

        if (to && to[0] === '#') {
            to = location.pathname + location.search + to
        } else if (to && to[0] === '?') {
            to = location.pathname + to
        }

        const idx = to.indexOf('?')
        const idx2 = to.indexOf('#')
        let pathname = ~idx
            ? to.substring(0, idx)
            : ~idx2
            ? to.substring(0, idx2)
            : to
        let search = ~idx ? to.substring(idx, ~idx2 ? idx2 : undefined) : ''
        let hash = ~idx2 ? to.substring(idx2) : location.hash

        if (!pathname) {
            pathname = location.pathname
        } else if (pathname[0] != '/' && !/^https?\:\/\//.test(pathname)) {
            let relativeBase = location.pathname
            const paths = relativeBase.split('/')
            paths.pop()
            let m
            while ((m = /^\.\.?\//.exec(pathname))) {
                if (m[0] === '../') {
                    paths.pop()
                }
                pathname = pathname.substring(m[0].length)
            }
            pathname = paths.concat(pathname).join('/')
        }

        return pathname + search + hash
    }

    function isCurrentUrl(to, ctx) {
        if (!to) {
            return false
        }
        const pathname = history.location.pathname
        const link = normalizeLink(to, {
            ...location,
            pathname,
            hash: '',
        })

        if (!~link.indexOf('http') && ~link.indexOf(':')) {
            let strict = ctx && ctx.strict
            return match(link, {
                decode: decodeURIComponent,
                strict: typeof strict !== 'undefined' ? strict : true,
            })(pathname)
        }

        return decodeURI(pathname) === link
    }

    function updateLocation(location, replace) {
        location = normalizeLink(location)
        if (location === 'goBack') {
            return history.goBack()
        } else if (
            (!/^https?\:\/\//.test(location) &&
                location ===
                    history.location.pathname + history.location.search) ||
            location === history.location.href
        ) {
            // 目标地址和当前地址一样，不处理，免得重复刷新
            return
        } else if (/^https?\:\/\//.test(location) || !history) {
            return (window.location.href = location)
        }

        history[replace ? 'replace' : 'push'](location)
    }

    function jumpTo(to, action) {
        if (to === 'goBack') {
            return history.goBack()
        }

        to = normalizeLink(to)

        if (isCurrentUrl(to)) {
            return
        }

        if (action && action.actionType === 'url') {
            const fullURL =
                to.indexOf('#/') >= 0
                    ? to
                    : to + '#' + (history.location.pathname || '/')
            action.blank === false
                ? (window.location.href = fullURL)
                : window.open(fullURL, '_blank')
            return
        } else if (action && action.blank) {
            window.open(to, '_blank')
            return
        }

        if (/^https?:\/\//.test(to)) {
            window.location.href = to
        } else if (
            (!/^https?\:\/\//.test(to) &&
                to === history.pathname + history.location.search) ||
            to === history.location.href
        ) {
            // do nothing
        } else {
            history.push(to)
        }
    }

    function listen(amisInstance) {
        history.listen((state) => {
            amisInstance.updateProps({
                location: state.location || state,
            })
        })
    }

    return {
        isCurrentUrl,
        updateLocation,
        jumpTo,
        history,
        listen,
    }
}
nbAmis.initAmis = function (rootId, appConfig) {
    // const appPath = Cookies.get('nebula-app-path') || ''
    const hashHistory = nbAmis.initHashHistory()
    const amis = amisRequire('amis/embed')
    const amisInstance = amis.embed(
        rootId,
        appConfig,
        {
            // 这里是初始 props，一般不用传。
            // locale: 'en-US' // props 中可以设置语言，默认是中文
            location: hashHistory.history.location,
        },
        {
            // 下面是一些可选的外部控制函数
            // 在 sdk 中可以不传，用来实现 ajax 请求，但在 npm 中这是必须提供的
            // fetcher: (url, method, data, config) => {},
            // 全局 api 请求适配器
            // 另外在 amis 配置项中的 api 也可以配置适配器，针对某个特定接口单独处理。
            //
            requestAdaptor(api) {
                // api.url = appPath + api.url
                return api
            },
            //
            // 全局 api 适配器。
            // 另外在 amis 配置项中的 api 也可以配置适配器，针对某个特定接口单独处理。
            responseAdaptor(api, payload, query, request, response) {
                if (response.status === 401) {
                    setTimeout(function () {
                        window.location.reload()
                    }, 500)
                }
                return payload
            },
            //
            // 用来接管页面跳转，比如用 location.href 或 window.open，或者自己实现 amis 配置更新
            // jumpTo: to => { location.href = to; },
            jumpTo: hashHistory.jumpTo,
            //
            // 用来实现地址栏更新
            // updateLocation: (to, replace) => {},
            updateLocation: hashHistory.updateLocation,
            //
            // 用来判断是否目标地址当前地址。
            // isCurrentUrl: url => {},
            isCurrentUrl: hashHistory.isCurrentUrl,
            //
            // 用来实现复制到剪切板
            // copy: content => {},
            //
            // 用来实现通知
            // notify: (type, msg) => {},
            //
            // 用来实现提示
            // alert: content => {},
            //
            // 用来实现确认框。
            // confirm: content => {},
            //
            // 主题，默认是 default，还可以设置成 cxd 或 dark，但记得引用它们的 css，比如 sdk 目录下的 cxd.css
            // theme: 'antd',
            //
            // 用来实现用户行为跟踪，详细请查看左侧高级中的说明
            // tracker: (eventTracker) => {},
            //
            // Toast提示弹出位置，默认为'top-center'
            // toastPosition: 'top-right' | 'top-center' | 'top-left' | 'bottom-center' | 'bottom-left' | 'bottom-right' | 'center'
        }
    )
    hashHistory.listen(amisInstance)
}
