#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
require('@babel/register')({
    presets: ['@babel/preset-env'],
})
const tsTypeMap = {
    'DataTypes.STRING': 'string',
    'DataTypes.UUID': 'string',
    'DataTypes.BOOLEAN': 'boolean',
    'DataTypes.INTEGER': 'number',
    'DataTypes.DATE': 'Date',
}
async function generateModelDef() {
    const folderPath = path.join(__dirname, '../src/models')
    const models = fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'))
    for (const file of models) {
        const text = fs.readFileSync(path.join(folderPath, file)).toString()
        const model = file.replace('.js', '')
        const regex =
            /[a-zA-Z]+\.init\(([\w\W]+\}),\s*\{\s*tableName\: decamelize\(modelName\)/
        const mch = regex.exec(text)
        // const attrs = eval('(' + mch[1] + ')')
        const attrText = mch[1]
            .replace(/\/\*\*[\w\W]+\*\//g, '') //去掉块注释
            .replace(/'/g, '')
            .replace(/([a-zA-z]+)\:\s/g, '"$1": ')
            .replace(/\:\s([^,^\{^\}^\n]+).*,/g, ': "$1",')
            .replace(/,\s*\}/g, '\n}')

        // console.log('-----------', file, attrText)
        let defText = `class ${model} extends BaseModel<InferAttributes<${model}>,InferCreationAttributes<${model}>> {\n`
        const attrs = JSON.parse(attrText)
        for (const name in attrs) {
            // console.log(attrs[name])
            defText += `    declare ${name}: ${tsTypeMap[attrs[name].type]}\n`
        }
        defText += '}'
        // console.log(defText)
        const newText = text
            .replace(
                'tableName: decamelize(modelName)',
                `tableName: decamelize(${model}.prototype.constructor.name)`
            )
            .replace(
                "import { Sequelize, DataTypes, Model } from 'sequelize'\n",
                "import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize'\n"
            )
            .replace(/module\.exports \= (.+)/, 'export default $1')
            .replace(`class ${model} extends BaseModel {}`, defText)
        console.log(newText)
        fs.writeFileSync(path.join(folderPath, `${model}.ts`), newText)
    }
}
generateModelDef()
    .then(() => {
        console.log('generate api docs successfully')
    })
    .catch((e) => {
        console.error(e)
    })
