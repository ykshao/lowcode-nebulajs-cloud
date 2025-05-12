#!/usr/bin/env node
require('@babel/register')({
    presets: ['@babel/preset-env'],
})
const port = process.env.HTTP_PORT || 3000
const { startup } = require('../app')

startup(port)
    .then((instance) => {})
    .catch((err) => {
        console.error(err)
    })
