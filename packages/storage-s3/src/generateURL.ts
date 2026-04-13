import type * as AWS from '@aws-sdk/client-s3'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface GenerateURLArgs {
  bucket: string
  collectionPrefix?: string
  endpoint?: AWS.S3ClientConfig['endpoint']
  filename: string
  prefix: string
  useCompositePrefixes?: boolean
}

export function generateURL({
  bucket,
  collectionPrefix = '',
  endpoint,
  filename,
  prefix,
  useCompositePrefixes = false,
}: GenerateURLArgs): string {
  const fileKey = getFileKey({
    collectionPrefix,
    docPrefix: prefix,
    filename: encodeURIComponent(filename),
    useCompositePrefixes,
  })

  const stringifiedEndpoint = typeof endpoint === 'string' ? endpoint : endpoint?.toString()

  return `${stringifiedEndpoint}/${bucket}/${fileKey}`
}
