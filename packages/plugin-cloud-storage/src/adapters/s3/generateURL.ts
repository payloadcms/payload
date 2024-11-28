import type * as AWS from '@aws-sdk/client-s3'

import path from 'path'

import type { GenerateURL } from '../../types.js'

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
    return `${endpoint}/${bucket}/${path.posix.join(prefix, filename)}`
  }
