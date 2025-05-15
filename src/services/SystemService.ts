import fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'

export class SystemService {
    static async isEmptyDatabase() {
        if (nebula.config.database.dialect === 'sqlite') {
            const sql = "select name from sqlite_master where type='table'"
            const [results, metadata] = await nebula.sequelize.query(sql)
            nebula.logger.debug('SQLite tables: %o', results)
            return results.length === 0
        } else if (nebula.config.database.dialect === 'mysql') {
        }
        return false
    }

    /**
     * 初始化SQLite
     */
    static async initDatabase() {
        const needInitialize = await this.isEmptyDatabase()
        if (needInitialize) {
            await nebula.sequelize.sync({ alter: true })
            // 初始化数据
            const sqlFile = fs
                .readFileSync(path.resolve('./res/init.sql'))
                .toString()
            const sqlCmds = sqlFile
                .split(/;\n/)
                .map((s) => s.trim())
                .filter((s) => s)
            for (const sql of sqlCmds) {
                await nebula.sequelize.query(sql, {
                    logging: console.log,
                    raw: true,
                    type: QueryTypes.RAW,
                })
            }
        }
        // const [results1] = await nebula.sequelize.query(
        //     'select * from app_user_role'
        // )
        // console.log('results1', results1)
    }
}
