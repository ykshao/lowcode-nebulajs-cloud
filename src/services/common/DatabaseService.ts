import { QueryTypes, Sequelize } from 'sequelize'
import { MiddlewareTypes } from '../../config/constants'
import Metalize from 'nebulajs-metalize'

export class DatabaseService {
    /**
     * @type {Sequelize}
     */
    sequelize = null

    options = null

    constructor(options) {
        options.dialect = options.dialect || options.type
        const { schema, username, password, host, port, dialect } = options
        this.options = options
        this.sequelize = new Sequelize(schema, username, password, {
            host,
            port,
            dialect,
            logging: (msg) => {
                nebula.logger.debug(msg)
            },
        })
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
        const { schema, dialect } = this.options
        if (dialect === MiddlewareTypes.MySQL) {
            // 需要指定小写列名，可能会区分大小写
            const ret = await this.sequelize.query(
                'select table_name as table_name, table_comment as table_comment from information_schema.tables where table_schema = :schema',
                {
                    raw: true,
                    type: QueryTypes.SELECT,
                    replacements: { schema: schema },
                }
            )
            return ret
                .filter((t) =>
                    prefix ? t.table_name.indexOf(prefix) === 0 : true
                )
                .map((t) => {
                    return { name: t.table_name, descr: t.table_comment }
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
        const { schema, username, password, host, port, dialect } = this.options
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
            nebula.logger.info(`获取数据库表结构：${JSON.stringify(metadata)}`)
        }
        return metadata
    }
}
