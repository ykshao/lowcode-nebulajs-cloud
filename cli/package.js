#!/usr/bin/env node
const cmd = require('./lib/cmd')
const pkg = require('../package.json')
async function packageDockerImage() {
    await cmd.execAsShell('npm', ['run', 'build'])
    await cmd.execAsShell('docker', [
        'build',
        '.',
        '-t',
        `${pkg.name}:${pkg.version}`,
    ])
    await cmd.execAsShell('docker', [
        'tag',
        `${pkg.name}:${pkg.version}`,
        `${pkg.name}:latest`,
    ])
}
packageDockerImage()
    .then(() => {
        console.info('Package Success.')
    })
    .catch((e) => {
        console.error(e)
    })
