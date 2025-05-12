#!/usr/bin/env node
const ejs = require('ejs')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const http = axios.create({
    timeout: 10000,
})
async function generateAPIDocs(prefix = '/api') {
    const port = process.env.HTTP_PORT || 3000
    const res = await http.get(
        `http://localhost:${port}/v2/api-docs?prefix=${prefix}`
    )
    const tpl = fs
        .readFileSync(path.join(__dirname, './templates', 'api.md.ejs'))
        .toString()
    const apis = res.data.paths
    const definitions = res.data.definitions
    const data = {}

    for (const path in apis) {
        for (const mth in apis[path]) {
            const detail = apis[path][mth]
            const tag = detail.tags[0]
            if (!data[tag]) {
                data[tag] = {
                    definitions: [],
                    apis: [],
                    schemas: [],
                }
            }
            detail.path = path
            detail.method = mth
            data[tag].apis.push(detail)

            // console.log(detail.responses['200']?.schema)

            if (detail.responses['200']?.schema) {
                data[tag].schemas.push(detail.responses['200'].schema)
            }
            for (const param of detail.parameters || []) {
                if (param.schema) {
                    data[tag].schemas.push(param.schema)
                }
            }
        }
    }

    for (const tag in data) {
        console.log('data[tag].schemas', tag, data[tag].schemas)
        data[tag].definitions = getSchemaDefinitions(data[tag].schemas)
    }

    // console.log('data', data)
    const mdFile = prefix.replace(/^\//, '')
    const text = ejs.render(tpl, { data, definitions })
    fs.writeFileSync(path.join(__dirname, `../docs/zh-cn/${mdFile}.md`), text)
}

function getSchemaDefinitions(schemas = []) {
    const defs = []
    for (const sch of schemas) {
        let def = ''
        if (sch?.$ref) {
            def = sch.$ref.replace(/#\/definitions\//, '')
        } else if (sch?.items?.$ref) {
            def = sch?.items?.$ref.replace(/#\/definitions\//, '')
        }
        if (!defs.includes(def)) {
            defs.push(def)
        }
    }
    return defs
}

generateAPIDocs()
    .then(() => {
        console.log('generate api docs successfully')
    })
    .catch((e) => {
        console.error(e)
    })
