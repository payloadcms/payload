import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type OSS from 'ali-oss'

import path from 'path'

interface Args {
  getStorageClient: () => OSS
}

export const getHandleDelete = ({ getStorageClient }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await getStorageClient().delete(path.posix.join(prefix, filename))
  }
}
