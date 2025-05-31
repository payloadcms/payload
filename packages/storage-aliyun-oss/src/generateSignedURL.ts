import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { ACLType } from 'ali-oss'
import type OSS from 'ali-oss'
import type { PayloadHandler } from 'payload'

import path from 'path'
import { APIError, Forbidden } from 'payload'

import type { AliyunOssStorageOptions } from './index.js'

interface Args {
  access?: ClientUploadsAccess
  acl?: ACLType
  collections: AliyunOssStorageOptions['collections']
  getStorageClient: () => OSS
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

type OSSExtended = {
  signatureUrlV4: (
    method: 'GET' | 'PUT',
    expires: number,
    request:
      | {
          headers?: Record<string, string>
          query?: Record<string, string>
        }
      | undefined,
    objectName: string,
    additionalHeaders?: string[],
  ) => Promise<string[]>
} & OSS

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  acl,
  collections,
  getStorageClient,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Content-Type expected to be application/json', 400)
    }

    const { collectionSlug, filename, mimeType } = await req.json()

    const collectionAliyunOssConfig = collections[collectionSlug]
    if (!collectionAliyunOssConfig) {
      throw new APIError(`Collection ${collectionSlug} was not found in Aliyun OSS options`)
    }

    const prefix =
      (typeof collectionAliyunOssConfig === 'object' && collectionAliyunOssConfig.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    const fileKey = path.posix.join(prefix, filename)

    const url = await (getStorageClient() as OSSExtended).signatureUrlV4(
      'PUT',
      60 * 60,
      undefined,
      fileKey,
    )

    return Response.json({ url })
  }
}
