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
async function generateModelInit() {
    const folderPath = path.join(__dirname, '../src/models')
    const models = fs.readdirSync(folderPath).filter((f) => f.endsWith('.ts'))
    for (const file of models) {
        const text = fs.readFileSync(path.join(folderPath, file)).toString()
        const model = file.replace('.ts', '')
        const regex =
            /([\w\W]+)(class[^\{]+\{)([^\}]+)(\}\s+)([\w\W]+)(export default .+)/
        const mch = regex.exec(text)
        // const attrs = eval('(' + mch[1] + ')')
        // console.log(
        //     mch[1],
        //     '-----',
        //     mch[2],
        //     '-----',
        //     mch[3],
        //     '-----',
        //     mch[4],
        //     '-----',
        //     mch[5]
        // )
        const newText = text
            .replace(
                regex,
                '$1export $2$3    static initModel(sequelize) {\n    this.$5}$4'
            )
            .replace(`this.${model}.init`, 'this.init')
            .replace('const { sequelize } = nebula', '')
        console.log(newText)
        fs.writeFileSync(path.join(folderPath, `${model}.ts`), newText)
    }
}
generateModelInit()
    .then(() => {
        console.log('generate model init successfully')
    })
    .catch((e) => {
        console.error(e)
    })
