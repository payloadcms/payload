import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

import type { R2Bucket } from './types.js'

interface Args {
  basePrefix?: string
  bucket: R2Bucket
}

export const getHandleDelete = ({ basePrefix, bucket }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await bucket.delete(path.posix.join(joinPrefixes({ basePrefix, prefix }), filename))
  }
}
