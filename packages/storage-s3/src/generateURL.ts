import type * as AWS from '@aws-sdk/client-s3'
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

interface Args {
  bucket: string
  config: AWS.S3ClientConfig
}

export const getGenerateURL =
  ({ bucket, config: { endpoint } }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    if (filename == null) {
      return null
    }
    const stringifiedEndpoint = typeof endpoint === 'string' ? endpoint : endpoint?.toString()
    return `${stringifiedEndpoint}/${bucket}/${path.posix.join(prefix, filename)}`
  }
