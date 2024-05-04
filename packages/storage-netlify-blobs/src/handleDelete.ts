import type { Store } from '@netlify/blobs'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

interface Args {
  store: Store
}

export const getHandleDelete = ({ store }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const key = path.posix.join(prefix, filename)
    await store.delete(key)
  }
}
