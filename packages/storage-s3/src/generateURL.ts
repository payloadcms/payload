import type * as AWS from '@aws-sdk/client-s3'

import path from 'path'

interface GenerateURLArgs {
  bucket: string
  endpoint?: AWS.S3ClientConfig['endpoint']
  filename: string
  prefix: string
}

export function generateURL({ bucket, endpoint, filename, prefix }: GenerateURLArgs): string {
  const stringifiedEndpoint = typeof endpoint === 'string' ? endpoint : endpoint?.toString()
  return `${stringifiedEndpoint}/${bucket}/${path.posix.join(prefix, encodeURIComponent(filename))}`
}
