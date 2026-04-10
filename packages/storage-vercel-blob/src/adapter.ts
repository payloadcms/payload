import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

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

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({ baseUrl, filename, prefix: docPrefix, token }),

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

    staticHandler: (
      req,
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) =>
      getFile({
        baseUrl,
        cacheControlMaxAge,
        clientUploadContext,
        collection,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        token,
      }),
  })
}
