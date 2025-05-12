module.exports = {
    apps: [
        {
            name: 'nebulajs-cloud',
            script: './bin/www.js',
            env_dev: {
                NODE_ENV: 'dev',
            },
            env_uat: {
                NODE_ENV: 'uat',
                HTTP_PORT: '3000',
                WS_PORT: '3001',
            },
            env_prod: {
                NODE_ENV: 'prod',
                HTTP_PORT: '3000',
                WS_PORT: '3001',
            },
        },
    ],
}
