import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

import { buildStoragePathData, getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import fs from 'node:fs/promises'

export const staticFileBytes = new Map<string, Buffer>()

export const staticFileMediaAdapter: Adapter = ({ collection }) => ({
  name: 'static-file-media',
  copyFile: ({ from, to }) => {
    const bytes = staticFileBytes.get(from)

    if (!bytes || staticFileBytes.has(to)) {
      throw new Error('Cannot copy static file media')
    }

    staticFileBytes.set(to, Buffer.from(bytes))
    return Promise.resolve()
  },
  deleteFile: ({ storageFilePath }) => {
    staticFileBytes.delete(storageFilePath)
  },
  handleDelete: ({ storageFilePath }) => {
    staticFileBytes.delete(storageFilePath)
  },
  handleUpload: async ({ file, storageFilePath }) => {
    const bytes = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.buffer

    staticFileBytes.set(storageFilePath, Buffer.from(bytes))
  },
  staticHandler: async (req, { doc, params: { filename, prefix } }) => {
    const docPrefix = await getFilePrefix({
      collection,
      doc,
      filename,
      prefixQueryParam: prefix,
      req,
    })
    const { storageFilePath } = buildStoragePathData({
      docPrefix,
      filename,
    })
    const bytes = staticFileBytes.get(storageFilePath)

    if (!bytes) {
      return new Response(null, { status: 404 })
    }

    return new Response(new Uint8Array(bytes), {
      headers: { 'Content-Type': 'image/png' },
      status: 200,
    })
  },
})
