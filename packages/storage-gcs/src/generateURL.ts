import type { Storage } from '@google-cloud/storage'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface GenerateURLArgs {
  bucket: string
  client: Storage
  collectionPrefix?: string
  filename: string
  prefix: string
  useCompositePrefixes?: boolean
}

export function generateURL({
  bucket,
  client,
  collectionPrefix = '',
  filename,
  prefix,
  useCompositePrefixes = false,
}: GenerateURLArgs): string {
  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix: prefix,
    filename,
    useCompositePrefixes,
  })

  return client.bucket(bucket).file(fileKey).publicUrl()
}
