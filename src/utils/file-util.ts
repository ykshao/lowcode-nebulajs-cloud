import path from 'path'
import fs from 'fs'

export class FileUtil {
    static deleteDir(dest: string) {
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
    }

    /**
     * 拷贝目录
     * @param src
     * @param dest
     * @param hook
     */
    static copyDir(
        src: string,
        dest: string,
        hook = (src: string, dest: string) => {}
    ) {
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
                FileUtil.copyDir(childPath, path.join(dest, item), hook)
            }
        }
    }

    static async listFilesRecursive(
        src: string,
        hook: (filePath: string, fileName: string) => Promise<void>
    ) {
        const dirs = fs.readdirSync(src)
        for (const item of dirs) {
            const childPath = path.join(src, item)
            const temp = fs.statSync(childPath)
            if (temp.isFile()) {
                hook && (await hook(childPath, item))
            } else if (temp.isDirectory()) {
                await FileUtil.listFilesRecursive(childPath, hook)
            }
        }
    }

    static getFilename(path: string) {
        if (path) {
            const arr = path.split(/\//)
            return arr[arr.length - 1]
        }
        return ''
    }

    static getFileExtension(file: string) {
        if (file) {
            const arr = file.split(/\./)
            return arr.length > 1 ? arr[arr.length - 1].toLowerCase() : ''
        }
        return ''
    }
}
