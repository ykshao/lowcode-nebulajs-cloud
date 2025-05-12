const { execSync, spawnSync, spawn } = require('child_process')

module.exports = {
    execSync(cmd) {
        execSync(cmd, {
            cwd: process.cwd(),
            timeout: 1000 * 10,
            shell: true
        })
    },

    execAsShell(cmd, args, dir, log) {
        let execLog = ''
        const showLog = log === undefined || log === true
        if (showLog) {
            console.log(`正在执行：${cmd} ${args ? args.join(' ') : ''}`)
        }

        return new Promise((resolve, reject) => {
            const proc = spawn(cmd, args, {
                cwd: dir || process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            })

            proc.stdout.on('data', (data) => {
                execLog += data.toString()
                if (showLog) {
                    process.stdout.write(`${data}`)
                }
            })

            proc.stderr.on('data', (data) => {
                process.stderr.write(`${data}`)
            })

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(execLog)
                } else {
                    reject(new Error(`Execute command error. cmd:${cmd}, args:${args}, code:${code}`))
                }
            })
        })
    }
}
