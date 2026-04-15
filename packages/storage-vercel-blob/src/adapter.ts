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
  useCompositePrefixes?: boolean
}

export function createVercelBlobAdapter({
  access,
  addRandomSuffix,
  baseUrl,
  cacheControlMaxAge,
  clientUploads,
  token,
  useCompositePrefixes = false,
}: CreateVercelBlobAdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'vercel-blob',
    clientUploads,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        baseUrl,
        collectionPrefix: prefix,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({
        baseUrl,
        collectionPrefix: prefix,
        docPrefix,
        filename,
        token,
        useCompositePrefixes,
      }),

    handleUpload: async ({ data, file: { buffer, filename, mimeType } }) => {
      const result = await uploadFile({
        access,
        addRandomSuffix,
        buffer,
        cacheControlMaxAge,
        collectionPrefix: prefix,
        docPrefix: data.prefix,
        filename,
        mimeType,
        token,
        useCompositePrefixes,
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
        collectionPrefix: prefix,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        token,
        useCompositePrefixes,
      }),
  })
}
