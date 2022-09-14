import path from 'path'
import type * as AWS from '@aws-sdk/client-s3'
import type { GenerateURL } from '../../types'

interface Args {
  config: AWS.S3ClientConfig
  bucket: string
}

export const getGenerateURL =
  ({ config: { endpoint }, bucket }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return `${endpoint}/${bucket}/${path.posix.join(prefix, filename)}`
  }
