import type { Storage } from '@google-cloud/storage'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { getFileContent } from 'payload/internal'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

interface CreateGcsAdapterArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  clientUploads?: ClientUploadsConfig
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

export function createGcsAdapter({
  acl,
  bucket,
  clientUploads,
  getStorageClient,
  useCompositePrefixes = false,
}: CreateGcsAdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'gcs',
    clientUploads,
    requiresClientUploadReceipt: true,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        bucket,
        client: getStorageClient(),
        collectionPrefix: prefix,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    handleDelete: ({ storageFilePath }) =>
      deleteFile({
        bucket,
        client: getStorageClient(),
        storageFilePath,
      }),

    handleUpload: async ({ data, file, storageFilePath }) => {
      await uploadFile({
        acl,
        bucket,
        client: getStorageClient(),
        content: getFileContent(file),
        mimeType: file.mimeType,
        storageFilePath,
      })

      return data
    },

    staticHandler: (req, { doc, headers, params: { clientUploadContext, filename } }) =>
      getFile({
        bucket,
        client: getStorageClient(),
        clientUploadContext,
        collection,
        collectionPrefix: prefix,
        doc,
        filename,
        incomingHeaders: headers,
        req,
        useCompositePrefixes,
      }),
  })
}
