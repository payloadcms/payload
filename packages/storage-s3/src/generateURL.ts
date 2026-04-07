import type * as AWS from '@aws-sdk/client-s3'
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  basePrefix?: string
  bucket: string
  config: AWS.S3ClientConfig
}

export const getGenerateURL =
  ({ basePrefix, bucket, config: { endpoint } }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    const stringifiedEndpoint = typeof endpoint === 'string' ? endpoint : endpoint?.toString()
    return `${stringifiedEndpoint}/${bucket}/${path.posix.join(joinPrefixes(basePrefix, prefix), encodeURIComponent(filename))}`
  }
