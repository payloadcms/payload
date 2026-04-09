import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

import type { R2Bucket } from './types.js'

interface Args {
  bucket: R2Bucket
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

export const getHandleDelete = ({
  bucket,
  collectionPrefix = '',
  useCompositePrefixes = false,
}: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: prefix,
      filename,
      useCompositePrefixes,
    })
    await bucket.delete(fileKey)
  }
}
