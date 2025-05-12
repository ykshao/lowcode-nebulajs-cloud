import dev from './dev'
import uat from './uat'
import prod from './prod'
const env: typeof dev &
    typeof uat &
    typeof prod = require(`./${process.env.NODE_ENV}`)
export = env
