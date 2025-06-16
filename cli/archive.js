#!/usr/bin/env node
const cmd = require('./lib/cmd')
const utils = require('./lib/utils')
const pkg = require('../package.json')
const moment = require('moment')
const fs = require('fs')
const path = require('path')
const EOL = require('os')
async function packageTarGz(withNodeModules) {
    // tar -zcvf nebula-cloud.tar.gz bin cert cli dist docs lib static templates views .npmrc ecosystem.config.js package.json
    // tar -zcvf nebula-cloud.tar.gz bin cert cli dist docs lib static templates views ecosystem.config.js package.json
    const buildNo = moment().format('YYMMDDHHmmss')
    const buildTime = moment().format('YYYY-MM-DD HH:mm:ss')
    const lastCommits = await utils.getGitCommits(5)
    const version =
        `Build No: ${buildNo}` +
        EOL +
        `Build Time: ${buildTime}` +
        EOL +
        'Recent Submit: ' +
        EOL +
        lastCommits.map((c) => `[${c.time}] ${c.commit}`).join(EOL) +
        EOL
    const archiveName = `${pkg.name}-${pkg.version}.${moment().format(
        'YYMMDDHHmmss'
    )}.tar.gz`
    const archivePath = path.join('build/', archiveName)
    fs.writeFileSync(path.join(__dirname, '../.version'), version)
    await cmd.execAsShell('tar', [
        '-zcvf',
        archivePath,
        '.version bin res cli dist docs static templates views .npmrc ecosystem.config.js package.json',
        withNodeModules ? 'node_modules' : '',
    ])
    return archivePath
}
const withNodeModules = process.argv.includes('--with_node_modules')
packageTarGz(withNodeModules)
    .then((archiveName) => {
        console.info('Package Success. ')
        console.info('File path: ' + path.join(__dirname, '../', archiveName))
    })
    .catch((e) => {
        console.error(e)
    })
