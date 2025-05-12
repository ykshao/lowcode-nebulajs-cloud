import { DataTypes, STRING } from 'sequelize'
import { ClModelProp } from '../../models/ClModelProp'
import { ClModelRef } from '../../models/ClModelRef'
import decamelize from 'decamelize'
import randomstring from 'randomstring'

export class AmisService {
    static replaceApiPathWithPrefix(schemaString = '', prefix = '') {
        schemaString = schemaString.replace(
            /"url":\s*"\/(portal|rest|auth|api|cloud)\/(.+)"/g,
            `"url": "${prefix}/$1/$2"`
        )
        return schemaString
    }

    static SYSTEM_PROPS_LABEL = {
        createdAt: '创建时间',
        createdBy: '创建人',
        updatedAt: '更新时间',
        updatedBy: '更新人',
        remark: '备注',
    }
    /**
     * 根据数据类型生成Amis列表组件属性
     * @param prop
     * @returns {string}
     */
    static getAmisListColumnProps(prop) {
        const { name, comment, remark, nullable, len, dictCode } = prop
        const amisProps = {
            name,
            label: comment || AmisService.SYSTEM_PROPS_LABEL[name],
            type: 'text',
            source: undefined,
            format: undefined,
            options: undefined,
            sortable: true,
        }
        if (dictCode) {
            amisProps.type = 'mapping'
            amisProps.source = `$${dictCode}`
        } else {
            switch (prop.type) {
                case 'DATE':
                    amisProps.type = 'date'
                    amisProps.format = 'YYYY-MM-DD HH:mm:ss'
                    break
                case 'BOOLEAN':
                    amisProps.type = 'mapping'
                    amisProps.options = [
                        { label: '是', value: true },
                        { label: '否', value: false },
                    ]
                    break
                default:
            }
        }

        return JSON.stringify(amisProps)
    }

    static getAmisSearchFormItemProps(prop) {
        const { name, comment, remark, nullable, len, dictCode } = prop
        const amisProps = {
            name: `filter[${name}][eq]`,
            label: comment,
            type: 'input-text',
            size: 'full',
            clearable: undefined,
            options: undefined,
            format: undefined,
        }
        if (dictCode) {
            this.addDictSelectProps(amisProps, dictCode)
        } else {
            switch (prop.type) {
                case 'DATE':
                    amisProps.name = `filter[${name}][range]`
                    amisProps.type = 'input-date-range'
                    amisProps.format = 'YYYY-MM-DDTHH:mm:ss'
                    break
                case 'TIME':
                    amisProps.name = `filter[${name}][range]`
                    amisProps.type = 'input-datetime-range'
                    amisProps.format = 'YYYY-MM-DDTHH:mm:ss'
                    break
                case 'BOOLEAN':
                    amisProps.type = 'select'
                    amisProps.clearable = true
                    amisProps.options = [
                        { label: '是', value: true },
                        { label: '否', value: false },
                    ]
                    // amisProps.size = undefined
                    break
                case 'INTEGER':
                    break
                case 'DOUBLE':
                    break

                default:
            }
        }

        return JSON.stringify(amisProps)
    }

    /**
     * 根据数据类型生成Amis表单组件属性
     * @param prop
     * @param refs
     * @param readOnly 详情视图
     */
    static getAmisFormItemProps(
        prop: ClModelProp,
        refs: ClModelRef[],
        readOnly = false
    ) {
        const { name, comment, remark, nullable, len, dictCode } = prop
        const ref = refs.find((ref) => ref.srcProp === name)
        const amisProps = {
            name,
            label: comment,
            description: remark,
            required: !nullable,
            type: 'input-text',
            size: 'full',
            format: undefined,
            options: undefined,
            source: undefined,
            labelField: undefined,
            valueField: undefined,
            precision: undefined,
            disabled: readOnly,
        }
        if (dictCode) {
            this.addDictSelectProps(amisProps, dictCode)
        } else if (ref) {
            const refModelUrl = `/rest/${decamelize(ref.dest, {
                separator: '-',
            })}`
            amisProps.type = 'select'
            amisProps.source = {
                url: refModelUrl,
                method: 'get',
                data: {
                    //"sort[0]": "tag,asc",
                    size: 1000,
                },
            }
            amisProps.labelField = 'id'
            amisProps.valueField = 'id'
        } else {
            switch (prop.type) {
                case 'TEXT':
                    amisProps.type = 'textarea'
                    break
                case 'DATE':
                    amisProps.type = 'input-date'
                    amisProps.format = 'YYYY-MM-DD'
                    break
                case 'TIME':
                    amisProps.type = 'input-datetime'
                    amisProps.format = 'YYYY-MM-DD HH:mm:ss'
                    break
                case 'BOOLEAN':
                    amisProps.type = 'button-group-select'
                    amisProps.options = [
                        { label: '是', value: true },
                        { label: '否', value: false },
                    ]
                    amisProps.size = undefined
                    break
                case 'INTEGER':
                    amisProps.type = 'input-number'
                    amisProps.size = 'sm'
                    break
                case 'DOUBLE':
                    amisProps.type = 'input-number'
                    amisProps.size = 'sm'
                    amisProps.precision = 2
                    break

                default:
            }
        }

        return JSON.stringify(amisProps)
    }

    /**
     * 根据表单对象查询表单下面所有输入项
     * @param formObject
     * @param exceptTypes
     * @returns {[]}
     */
    static findAmisFormElements(formObject, exceptTypes = []) {
        const { body = [], columns = [] } = formObject
        const children = [...body, ...columns].filter((node) => node)

        let elements = []
        for (const el of children) {
            if (el.body && el.body.length > 0) {
                elements = elements.concat(
                    this.findAmisFormElements(el, exceptTypes)
                )
            } else if (el.columns && el.columns.length > 0) {
                elements = elements.concat(
                    this.findAmisFormElements(el, exceptTypes)
                )
            } else {
                if (!exceptTypes.includes(el.type)) {
                    elements.push(el)
                }
            }
        }
        return elements
    }

    // /**
    //  * 根据类型查询Amis对象
    //  * @param schemaObject
    //  * @param types
    //  * @returns {[]}
    //  */
    // static findElementsByTypes(schemaObject, types: string[]) {
    //     const {
    //         body = [],
    //         tabs = [],
    //         columns = [],
    //         buttons = [],
    //         headerToolbar = [],
    //         dialog,
    //     } = schemaObject
    //     const children = [
    //         ...body,
    //         ...tabs,
    //         ...columns,
    //         ...buttons,
    //         ...headerToolbar,
    //         dialog,
    //     ].filter((node) => node)
    //
    //     let elements = []
    //     for (const el of children) {
    //         if (types.includes(el.type)) {
    //             elements.push(el)
    //         } else {
    //             elements = elements.concat(this.findElementsByTypes(el, types))
    //         }
    //     }
    //     return elements
    // }

    static addDictSelectProps(amisProps, dictCode) {
        amisProps.type = 'select'
        amisProps.clearable = true
        amisProps.source = `$${dictCode}`
        amisProps.labelField = 'label'
        amisProps.valueField = 'value'
    }

    static findElementsByTypes(schema, types: string[]) {
        let elements = []
        if (!schema) {
            return elements
        }
        if (types.includes(schema.type)) {
            elements.push(schema)
        } else {
            const keys = Object.keys(schema)
            keys.forEach((key) => {
                if (Array.isArray(schema[key])) {
                    schema[key].forEach((node) => {
                        elements = elements.concat(
                            this.findElementsByTypes(node, types)
                        )
                    })
                } else if (typeof schema[key] === 'object') {
                    elements = elements.concat(
                        this.findElementsByTypes(schema[key], types)
                    )
                }
            })
        }
        return elements
    }

    static generateNewNodeId(schema) {
        schema.id = `u:${randomstring.generate({
            length: 12,
            capitalization: 'lowercase',
        })}`
        const keys = Object.keys(schema)
        keys.forEach((key) => {
            if (Array.isArray(schema[key])) {
                schema[key].forEach((node) => {
                    this.generateNewNodeId(node)
                })
            } else if (typeof schema[key] === 'object' && schema[key]) {
                this.generateNewNodeId(schema[key])
            }
        })
    }
}
