export const whitePathList = [
    'get ^/swagger/v2/api-docs', // swagger
    'get ^/login', // 登录页面
    'post ^/auth/login',
    'post ^/oauth/token$',
    'get ^/oauth/token_key$',
    'get ^/oauth/authorize/', // CAS授权登录
    'get ^/oauth/callback/', // CAS回调
]
