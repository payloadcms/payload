import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY } from 'payload'

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
  /**
   * Store ID used for OIDC authentication. Passed to @vercel/blob so it can
   * target the right store when authenticating via OIDC (no read/write token).
   */
  storeId?: string
  /**
   * Read/write token. When undefined, @vercel/blob resolves OIDC credentials
   * from the environment instead.
   */
  token?: string
  useCompositePrefixes?: boolean
}

export function createVercelBlobAdapter({
  access,
  addRandomSuffix,
  baseUrl,
  cacheControlMaxAge,
  clientUploads,
  storeId,
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
        storeId,
        token,
      }),

    handleUpload: async ({
      data,
      file: { buffer, imageSizeName, mimeType, tempFilePath },
      req,
      storageFilePath,
    }) => {
      // A processed client upload keeps the storage key from its receipt.
      const isClientUpload =
        Boolean(tempFilePath) &&
        tempFilePath === req.context?.[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]
      const result = await uploadFile({
        access,
        addRandomSuffix: addRandomSuffix && !isClientUpload,
        buffer,
        cacheControlMaxAge,
        mimeType,
        storageFilePath,
        storeId,
        tempFilePath,
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
        storeId,
        token,
        useCompositePrefixes,
      }),
  })
}
