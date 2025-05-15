import { Client, CopyConditions } from 'minio'
import { lookup, mimes } from 'mrmime'
import { minio as minioConfig } from '../../config/env'
import { NebulaBizError } from 'nebulajs-core'
import { ApplicationErrors } from '../../config/errors'

export class FileService {
    clientAppCode: string

    bucketPrefix: string

    tempBucket: string
    defaultBucket: string
    publicBucket: string

    minioClient: Client

    constructor(clientAppCode, config = minioConfig) {
        // Minio bucket里不能包含下划线
        this.bucketPrefix = `nebula-${clientAppCode
            .replace(/[\-_]/g, '')
            .toLowerCase()}`
        this.clientAppCode = clientAppCode
        this.tempBucket = `temp`
        this.defaultBucket = `${this.bucketPrefix}-default`
        this.publicBucket = `${this.bucketPrefix}-public`
        this.minioClient = new Client(config)
    }

    async createAppBuckets() {
        const buckets = [this.defaultBucket, this.publicBucket]
        for (const bucket of buckets) {
            nebula.logger.info('Create minio bucket: %s', bucket)
            try {
                await this.minioClient.makeBucket(bucket)
            } catch (e) {
                if (e.code === 'BucketAlreadyOwnedByYou') {
                    throw new NebulaBizError(
                        ApplicationErrors.StorageBucketAlreadyExist
                    )
                } else {
                    throw e
                }
            }
        }
    }

    /**
     * 上传到临时文件目录
     * @param name
     * @param stream
     * @returns {Promise<string>}
     */
    async putTempFile(name, stream) {
        const putRes = await this.minioClient.putObject(
            this.tempBucket,
            name,
            stream,
            null,
            {
                'Content-Type': lookup(name),
            }
        )
        nebula.logger.info('minio put temp file result: %o', putRes)

        const key = `${this.tempBucket}:${name}`
        const url = await this.getDownloadURL(key)
        return {
            fileKey: key,
            name,
            url,
        }
    }

    /**
     *
     * @param keys
     * @param bucket
     * @returns {Promise<String>}
     */
    async archiveFiles(keys: string[], bucket?: string): Promise<string[]> {
        bucket = bucket || this.defaultBucket
        const list = await this.copyFiles(keys, bucket)
        return list
    }

    async archiveFilesToPublic(keys: string[]): Promise<string[]> {
        return this.archiveFiles(keys, this.publicBucket)
    }

    /**
     *
     * @param keys
     * @returns {Promise<String>}
     */
    async discardFile(keys: string[]): Promise<string[]> {
        const list = await this.copyFiles(keys, this.tempBucket)
        return list
    }

    private async copyFiles(
        keyList: string[],
        targetBucket
    ): Promise<string[]> {
        const conds = new CopyConditions()
        const newKeyList = []
        for (const key of keyList) {
            const [srcBucket, srcName] = key.split(/:/)
            const copyRes = await this.minioClient.copyObject(
                targetBucket,
                srcName,
                `/${srcBucket}/${srcName}`,
                conds
            )
            nebula.logger.info(
                'minio copy object from %s to %s.',
                key,
                targetBucket
            )
            newKeyList.push(`${targetBucket}:${srcName}`)
        }
        return newKeyList
    }

    /**
     * 获取公开地址
     * @param key
     * @returns {string}
     */
    getPublicURL(key: string) {
        const [bucket, name] = key.split(/:/)
        const baseURL = `${minioConfig.useSSL ? 'https' : 'http'}://${
            minioConfig.endPoint
        }:${minioConfig.port}`
        return `${baseURL}/${bucket}/${encodeURI(name)}`
    }

    /**
     *
     * @param key
     * @param expiry {number}  default 7 days
     * 过期参数不能大于7天，minio会报错
     */
    async getDownloadURL(key, expiry: number = 3600 * 24 * 7) {
        const [bucket, name] = key.split(/:/)
        const reqParams = {}
        const presignedUrl = await this.minioClient.presignedGetObject(
            bucket,
            name,
            expiry,
            reqParams
        )
        return presignedUrl
    }
}
