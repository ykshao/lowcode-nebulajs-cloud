const fs = require('fs')
const path = require('path')
const moment = require('moment')
const git = require('isomorphic-git')

module.exports = {
    deleteDir(dest) {
        if (fs.existsSync(dest)) {
            if (fs.statSync(dest).isDirectory()) {
                let files = fs.readdirSync(dest)
                files.forEach((file) => {
                    let curPath = path.join(dest, file)
                    this.deleteDir(curPath)
                })
                fs.rmdirSync(dest)
            } else {
                fs.unlinkSync(dest)
            }
        }
    },

    /**
     * 拷贝目录
     * @param src
     * @param dest
     * @param hook
     */
    copyDir(src, dest, hook = (src, dest) => {}) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest)
        }
        const dirs = fs.readdirSync(src)
        for (const item of dirs) {
            const childPath = path.join(src, item)
            const temp = fs.statSync(childPath)
            if (temp.isFile()) {
                fs.copyFileSync(childPath, path.join(dest, item))
                hook(childPath, path.join(dest, item))
            } else if (temp.isDirectory()) {
                this.copyDir(childPath, path.join(dest, item), hook)
            }
        }
    },

    async listFilesRecursive(src, hook) {
        const dirs = fs.readdirSync(src)
        for (const item of dirs) {
            const childPath = path.join(src, item)
            const temp = fs.statSync(childPath)
            if (temp.isFile()) {
                hook && (await hook(childPath, item))
            } else if (temp.isDirectory()) {
                await this.listFilesRecursive(childPath, hook)
            }
        }
    },

    async getGitCommits(lines) {
        let commits = await git.log({
            fs,
            dir: '.',
            depth: lines,
        })
        const commitRules = [
            'chore',
            'feat', // 新功能（feature）
            'fix', // 修补bug
            'docs', // 文档（documentation）
            'style', // 格式（不影响代码运行的变动）
            'refactor', // 重构（即不是新增功能，也不是修改bug的代码变动）
            'test', // 增加测试
        ]
        commits = commits
            .filter((cm) => !cm.commit.message.startsWith('Merge'))
            .filter((cm) => {
                for (const r of commitRules) {
                    if (cm.commit.message.indexOf(r + ':') >= 0) return true
                }
                return false
            })
            .map((cm) => {
                return {
                    id: cm.oid,
                    commit: cm.commit.message
                        .trim()
                        .replace(/["']/g, '')
                        .replace(/\n/g, ' '),
                    author: cm.commit.committer.name,
                    time: moment(cm.commit.committer.timestamp * 1000).format(
                        'YYYY-MM-DD HH:mm:ss'
                    ),
                }
            })
        if (commits.length > 20) {
            commits.length = 20
        }
        return commits
    },
}
