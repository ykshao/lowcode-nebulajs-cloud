import ExcelJS, { Workbook } from 'exceljs'
import { Model, ModelStatic } from 'sequelize'
import moment from 'moment'
export class ExcelUtil {
    static async exportExcel(
        ctx,
        model: ModelStatic<any>,
        dataList: Model[],
        ignoreAttrs: string[] = []
    ) {
        // 设置下载文件名
        const filename = `${model.name}${
            model.options.comment
        }_${moment().format('x')}.xlsx`
        // 设置响应头，告诉浏览器下载文件
        ctx.res.writeHead(200, {
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=${encodeURIComponent(
                filename
            )}`,
        })
        nebula.logger.info(`导出Excel数据文件：${filename}`)

        const workbook = this.getModelDataExcel(model, dataList, ignoreAttrs)
        const buffer = await workbook.xlsx.writeBuffer()
        ctx.res.write(buffer)
    }

    static getModelDataExcel(
        model: ModelStatic<any>,
        dataList: Model[],
        ignoreAttrs: string[] = []
    ) {
        const workbook = new ExcelJS.Workbook()
        // const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        //     stream: ctx.res,
        //     filename: 'test.xlsx',
        // })
        const sheet = workbook.addWorksheet('Sheet1')
        const attrs = Object.keys(model.getAttributes())
            .filter((key) => !ignoreAttrs.includes(key))
            .map((key) => model.getAttributes()[key])
            .map((attr) => {
                delete attr['_modelAttribute']
                return { ...attr, excelCol: attr['fieldName'] }
            })
        sheet.columns = attrs.map((attr) => {
            return {
                header: attr.comment,
                key: (attr as any).fieldName,
                // width: 30,
            }
        })
        for (const item of dataList) {
            sheet.addRow(item.dataValues)
        }
        return workbook
    }
}
