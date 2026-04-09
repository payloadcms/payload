import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { generateURL } from './generateURL.js'
import { deleteFile } from './handleDelete.js'
import { uploadFile } from './handleUpload.js'
import { getFile } from './staticHandler.js'

interface CreateVercelBlobAdapterArgs {
  access: 'public'
  addRandomSuffix?: boolean
  baseUrl: string
  cacheControlMaxAge: number
  clientUploads?: ClientUploadsConfig
  token: string
}

export function createVercelBlobAdapter({
  access,
  addRandomSuffix,
  baseUrl,
  cacheControlMaxAge,
  clientUploads,
  token,
}: CreateVercelBlobAdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'vercel-blob',
    clientUploads,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({ baseUrl, filename, prefix: urlPrefix }),

    handleDelete: async ({ doc: { prefix: docPrefix = '' }, filename }) =>
      await deleteFile({ baseUrl, filename, prefix: docPrefix, token }),

    handleUpload: async ({ data, file: { buffer, filename, mimeType } }) => {
      const result = await uploadFile({
        access,
        addRandomSuffix,
        baseUrl,
        buffer,
        cacheControlMaxAge,
        filename,
        mimeType,
        prefix: data.prefix || prefix,
        token,
      })

      if (result.filename) {
        data.filename = result.filename
      }

      return data
    },

    staticHandler: async (req, { headers, params: { clientUploadContext, filename } }) =>
      await getFile({
        baseUrl,
        cacheControlMaxAge,
        clientUploadContext,
        collection,
        filename,
        incomingHeaders: headers,
        req,
        token,
      }),
  })
}
