import type * as AWS from '@aws-sdk/client-s3'
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  bucket: string
  collectionPrefix?: string
  config: AWS.S3ClientConfig
  useCompositePrefixes?: boolean
}

export const getGenerateURL =
  ({
    bucket,
    collectionPrefix = '',
    config: { endpoint },
    useCompositePrefixes = false,
  }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: prefix,
      filename: encodeURIComponent(filename),
      useCompositePrefixes,
    })
    const stringifiedEndpoint = typeof endpoint === 'string' ? endpoint : endpoint?.toString()
    return `${stringifiedEndpoint}/${bucket}/${fileKey}`
  }
