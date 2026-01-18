import type { HandleDelete } from '@ruya.sa/plugin-cloud-storage/types'

import path from 'path'

import type { R2Bucket } from './types.js'

interface Args {
  bucket: R2Bucket
}

export const getHandleDelete = ({ bucket }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await bucket.delete(path.posix.join(prefix, filename))
  }
}
