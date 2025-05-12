import fs from 'fs'
import git, { GitAuth } from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import { FileUtil } from '../../utils/file-util'
import moment from 'moment'

export class GitService {
    dir: string
    gitAuth: GitAuth

    constructor(dir: string, gitAuth?: GitAuth) {
        this.dir = dir
        this.gitAuth = gitAuth
    }

    async init() {
        await git.init({
            fs,
            dir: this.dir,
        })
    }

    async clone(gitAuth: GitAuth, url, ref?) {
        await git.clone({
            fs,
            http,
            dir: this.dir,
            url,
            ref,
            onAuth: (url: string, auth: GitAuth) => {
                return gitAuth
            },
        })
    }

    async checkout(ref?) {
        await git.checkout({
            fs,
            dir: this.dir,
            ref,
        })
    }

    async log(ref = 'HEAD', depth = 8) {
        return await git.log({
            fs,
            dir: this.dir,
            depth, //Limit the number of commits returned. No limit by default.
            ref,
        })
    }

    async listLatestCommits() {
        const commits = await this.log()
        return commits.map((c) => {
            return {
                author: c.commit.author.name,
                message: c.commit.message,
                timestamp: moment(c.commit.committer.timestamp * 1000).format(
                    'MM-DD HH:mm'
                ),
            }
        })
    }

    async listServerRefs(gitAuth: GitAuth, url) {
        let refs1 = await git.listServerRefs({
            http,
            url,
            prefix: 'refs/heads/',
            onAuth: (url: string, auth: GitAuth) => {
                return gitAuth
            },
        })

        // let refs2 = await git.listServerRefs({
        //     http,
        //     url,
        //     prefix: 'HEAD',
        //     symrefs: true,
        //     onAuth: (url: string, auth: GitAuth) => {
        //         return {
        //             username: 'jindong05@126.com',
        //             password: '08090516',
        //         }
        //     },
        // })
        // console.log(refs1, refs2)
        return refs1
    }

    async listRemotes() {
        return await git.listRemotes({ fs, dir: this.dir })
    }

    async addRemote(urlWithAuth, remote = 'origin') {
        await git.addRemote({
            fs,
            dir: this.dir,
            remote,
            url: urlWithAuth,
        })
    }

    async deleteRemote(remote = 'origin') {
        await git.deleteRemote({ fs, dir: this.dir, remote })
    }

    async pull(
        gitAuth: GitAuth,
        author: { name: string; email: string },
        remote = 'origin'
    ) {
        await git.pull({
            fs,
            http,
            dir: this.dir,
            remote,
            // ref: 'main', //Which branch to merge into. By default this is the currently checked out branch.
            // singleBranch: false, //Instead of the default behavior of fetching all the branches, only fetch a single branch.
            author,
            onAuth: (url: string, auth: GitAuth) => {
                return gitAuth
            },
        })
    }

    async push(gitAuth: GitAuth, ref = 'master') {
        await git.push({
            fs,
            http,
            dir: this.dir,
            ref, //Which branch to push. By default this is the currently checked out branch.
            // remoteRef:'',
            onAuth: (url: string, auth: GitAuth) => {
                return gitAuth
            },
        })
    }

    async tag(tag) {
        return await git.tag({
            fs,
            dir: this.dir,
            ref: tag,
        })
    }

    async status(filepath: string = '.') {
        return await git.status({
            fs,
            dir: this.dir,
            filepath,
        })
    }

    async listBranches() {
        return await git.listBranches({
            fs,
            dir: this.dir,
        })
    }

    async currentBranch() {
        return await git.currentBranch({
            fs,
            dir: this.dir,
            fullname: false,
        })
    }

    async commitDir(message: string, author: { name: string; email: string }) {
        await git.add({
            fs,
            dir: this.dir,
            filepath: '.',
        })
        await this.commit(message, author)
    }

    async commit(message: string, author: { name: string; email: string }) {
        await git.commit({
            fs,
            dir: this.dir,
            author,
            message,
        })
    }

    static getDefaultAuthor(userLogin: string) {
        return {
            name: userLogin,
            email: `${userLogin}@nebulajs.com`,
        }
    }
}
