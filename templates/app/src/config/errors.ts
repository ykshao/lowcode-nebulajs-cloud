import { NebulaErrors } from 'nebulajs-core'

/**
 * 通用模块（编码前缀：11）
 */
export class CommonErrors extends NebulaErrors.BadRequestErrors {
    static NoUserCompanies = { code: 11100, msg: '当前用户未关联公司' }
    static NoUserDepartments = { code: 11101, msg: '当前用户未关联部门' }
}

/**
 * 业务模块1（编码前缀：20）
 */
export class CustomBizError1 extends NebulaErrors.BadRequestErrors {}

/**
 * 业务模块2（编码前缀：21）
 */
export class CustomBizError2 extends NebulaErrors.BadRequestErrors {}
