import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import { del } from '@vercel/blob'
import path from 'path'

type HandleDeleteArgs = {
  basePrefix?: string
  baseUrl: string
  token: string
}

export const getHandleDelete = ({ basePrefix, baseUrl, token }: HandleDeleteArgs): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const fileUrl = `${baseUrl}/${path.posix.join(joinPrefixes(basePrefix, prefix), filename)}`
    const deletedBlob = await del(fileUrl, { token })

    return deletedBlob
  }
}
