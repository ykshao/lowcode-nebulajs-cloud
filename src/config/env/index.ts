import dev from './dev'
import prod from './prod'
const env: typeof dev & typeof prod = require(`./${process.env.NODE_ENV}`)
export = env
