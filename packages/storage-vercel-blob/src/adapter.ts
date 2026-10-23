import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY } from 'payload'
import { getFileSource } from 'payload/internal'

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

    handleUpload: async ({ data, file, req, storageFilePath }) => {
      const { imageSizeName, mimeType, tempFilePath } = file
      // A processed client upload should not receive another random suffix.
      const isClientUpload =
        Boolean(tempFilePath) &&
        tempFilePath === req.context?.[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]
      const result = await uploadFile({
        access,
        addRandomSuffix: addRandomSuffix && !isClientUpload,
        cacheControlMaxAge,
        mimeType,
        source: getFileSource(file),
        storageFilePath,
        token,
      })

      if (result.filename) {
        if (imageSizeName !== undefined) {
          data.sizes[imageSizeName].filename = result.filename
        } else {
          data.filename = result.filename
        }
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
