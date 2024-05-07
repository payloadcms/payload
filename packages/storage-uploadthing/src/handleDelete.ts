import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { UTApi } from 'uploadthing/server'

import path from 'path'

interface Args {
  utApi: UTApi
}

export const getHandleDelete = ({ utApi }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await utApi.deleteFiles(path.posix.join(prefix, filename))
  }
}
