import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { del } from '@vercel/blob'
import path from 'path'

type HandleDeleteArgs = {
  baseUrl: string
  prefix?: string
  token: string
}

export const getHandleDelete = ({ baseUrl, token }: HandleDeleteArgs): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const fileUrl = `${baseUrl}/${path.posix.join(prefix, filename)}`
    const deletedBlob = await del(fileUrl, { token })

    return deletedBlob
  }
}
