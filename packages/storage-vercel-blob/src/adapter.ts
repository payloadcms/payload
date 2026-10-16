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
    requiresClientUploadReceipt: true,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        baseUrl,
        collectionPrefix: prefix,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    handleDelete: ({ storageFilePath }) =>
      deleteFile({
        baseUrl,
        storageFilePath,
        token,
      }),

    handleUpload: async ({ data, file: { buffer, mimeType }, storageFilePath }) => {
      const result = await uploadFile({
        access,
        addRandomSuffix,
        buffer,
        cacheControlMaxAge,
        mimeType,
        storageFilePath,
        token,
      })

      if (result.filename) {
        data.filename = result.filename
      }

      return data
    },

    staticHandler: (req, { doc, headers, params: { clientUploadContext, filename } }) =>
      getFile({
        baseUrl,
        cacheControlMaxAge,
        clientUploadContext,
        collection,
        collectionPrefix: prefix,
        doc,
        filename,
        incomingHeaders: headers,
        req,
        token,
        useCompositePrefixes,
      }),
  })
}
