#!/usr/bin/env node
const { minify } = require('terser')
const fs = require('fs')
const path = require('path')
const utils = require('./lib/utils')
async function minifyJSCode() {
    await utils.listFilesRecursive(
        path.join(__dirname, '../dist'),
        async (filePath, item) => {
            if (!item.endsWith('.js')) {
                return
            }
            console.log(`minify: ${filePath}`)
            const { code } = await minify(
                fs.readFileSync(filePath).toString(),
                {
                    compress: true,
                    mangle: true,
                }
            )
            fs.writeFileSync(filePath, code)
            // console.log(code)
        }
    )
}
minifyJSCode()
    .then(() => {
        console.info('Minify Success.')
    })
    .catch((e) => {
        console.error(e)
    })
