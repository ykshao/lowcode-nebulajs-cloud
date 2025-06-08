import { QueryTypes, Sequelize } from 'sequelize'
import { MiddlewareTypes } from '../../config/constants'
import Metalize from 'nebulajs-metalize'
import { ApplicationService } from '../ApplicationService'
import { ClMiddleware } from '../../models/ClMiddleware'

export class DatabaseService {
    sequelize: Sequelize = null

    options: ClMiddleware & { dialect: string } = null

    constructor(options) {
        options.dialect = options.dialect || options.type
        const { schema, username, password, host, port, dialect, dataPath } =
            options
        this.options = options
        if (dialect === MiddlewareTypes.SQLite) {
            this.sequelize = new Sequelize({
                dialect: 'sqlite',
                timezone: '+00:00',
                storage: dataPath,
                logging: (msg) => {
                    nebula.logger.debug(msg)
                },
            })
        } else {
            this.sequelize = new Sequelize(schema, username, password, {
                host,
                port,
                dialect,
                logging: (msg) => {
                    nebula.logger.debug(msg)
                },
            })
        }
    }

    /**
     * 断开数据库
     * @returns {Promise<void>}
     */
    async disconnect() {
        await this.sequelize.connectionManager.close()
    }

    /**
     * 测试连接数据库
     * @returns {Promise<void>}
     */
    async test() {
        await this.sequelize.authenticate()
    }

    /**
     * 获取数据库表
     * @param prefix
     * @returns {Promise<*[]|{descr: *, name: *}[]>}
     */
    async getDatabaseTables(prefix) {
        const { schema, dialect, host, app, dataPath } = this.options
        if (dialect === MiddlewareTypes.MySQL) {
            // 需要指定小写列名，可能会区分大小写
            const ret = await this.sequelize.query(
                'select table_name as table_name, table_comment as table_comment ' +
                    'from information_schema.tables ' +
                    'where table_schema = :schema',
                {
                    raw: true,
                    type: QueryTypes.SELECT,
                    replacements: { schema: schema },
                }
            )
            return ret
                .filter((t: any) =>
                    prefix ? t.table_name.indexOf(prefix) === 0 : true
                )
                .map((t: any) => {
                    return { name: t.table_name, descr: t.table_comment }
                })
        } else if (dialect === MiddlewareTypes.SQLite) {
            const sequelize = new Sequelize({
                dialect: 'sqlite',
                timezone: '+00:00',
                storage: dataPath,
            })
            const sql = "select name from sqlite_master where type = 'table'"
            const [results, metadata] = await sequelize.query(sql)
            return results.map((t) => {
                return { name: (t as any).name, descr: '' }
            })
        }
        return []
    }

    /**
     * 获取数据库表结构
     * @param tables
     * @param sequences
     */
    async getDatabaseMetadata(tables = [], sequences = []) {
        const { schema, username, password, host, port, dialect, app } =
            this.options
        const metadata = {
            tables: {},
        }
        if (dialect === MiddlewareTypes.MySQL) {
            const metalize = new Metalize({
                dialect: 'mysql',
                connectionConfig: {
                    host,
                    port,
                    user: username,
                    password,
                    database: schema,
                },
            })
            const result = await metalize.find({
                tables: tables.map((t) => `${schema}.${t}`),
                sequences: sequences.map((t) => `${schema}.${t}`),
            })
            result.tables.forEach((t, k) => {
                const key = k.split('.')[1]
                if (key && t) {
                    t.columns.forEach((col: any) => {
                        // 获取最大长度
                        const mch = new RegExp(/.+\(([\d\,]+)\)/).exec(col.type)
                        col.maxLength = mch ? mch[1] : null
                    })
                    metadata.tables[key] = t
                }
            })
        } else if (dialect === MiddlewareTypes.SQLite) {
            for (const tab of tables) {
                const sql = `PRAGMA table_info(${tab})`
                const [results] = await this.sequelize.query(sql)
                const columns = results.map((c) => {
                    // {
                    //     cid: 12,
                    //     name: 'updated_at',
                    //     type: 'DATETIME',
                    //     notnull: 1,
                    //     dflt_value: null,
                    //     pk: 0
                    // }
                    const { pk, name, notnull, type } = c as any
                    const mch = new RegExp(/.+\(([\d\,]+)\)/).exec(type)
                    return {
                        name: name,
                        type: type,
                        comment: '',
                        default: null,
                        nullable: notnull !== 1,
                        identity: pk === 1,
                        maxLength: mch ? mch[1] : null,
                    }
                })
                metadata.tables[tab] = {
                    name: tab,
                    comment: '',
                    columns,
                    foreignKeys: [],
                }
            }
        }
        nebula.logger.info(`获取数据库表结构：${JSON.stringify(metadata)}`)

        return metadata
    }
}
