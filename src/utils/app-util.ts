import { ClApplication } from '../models/ClApplication'
import { Op } from 'sequelize'
import { NebulaBizError } from 'nebulajs-core'
import { ApplicationErrors } from '../config/errors'
import numeral from 'numeral'

export class AppUtil {
    /**
     * 获取应用基础端口
     * 该应用下所有的中间件端口都会以基础端口作为前缀。
     * 如：基础端口为50，则自动分配的端口可以为5001，5002
     * @returns {Promise<string|*>}
     */
    static async getApplicationBasePort(startPort = 50) {
        const existBasePorts = (
            await ClApplication.findAll({
                attributes: ['basePort'],
                order: [['basePort', 'asc']],
                where: {
                    basePort: {
                        [Op.gte]: startPort,
                    },
                },
            })
        )
            .map((m) => m.dataValues.basePort)
            .map((p) => parseInt(p))
        nebula.logger.info(`获取已存在基础端口列表：${existBasePorts}`)
        return this.getPortFromRange(existBasePorts, startPort, 99)
    }

    /**
     * 获取实例端口
     * @param existPorts
     * @param startPort
     * @param endPort
     * @returns {string}
     */
    static getPortFromRange(
        existPorts: number[],
        startPort: number,
        endPort: number
    ) {
        for (let p = startPort; p < endPort; p++) {
            if (!existPorts.includes(p)) {
                return numeral(p).format('00')
            }
        }
        throw new NebulaBizError(ApplicationErrors.NoAvailablePortFound)
    }

    /**
     * 从0-99获取可用子端口号（两位）
     * @param existPorts
     * @param num
     */
    static getSubPorts(existPorts: number[], num = 1): string[] {
        const ports = []
        for (let i = 0; i < num; i++) {
            const port = this.getPortFromRange(existPorts, 0, 99)
            ports.push(port)
            existPorts.push(parseInt(port))
        }
        return ports
    }

    static isNebulaApp(code) {
        return code === 'nebula'
    }
}
