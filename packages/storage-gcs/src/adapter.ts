import type { Storage } from '@google-cloud/storage'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { deleteFile } from './deleteFile.js'
import { generateUploadInstructions } from './generateUploadInstructions.js'
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

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        bucket,
        client: getStorageClient(),
        collectionPrefix: prefix,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    uploadInstructions: {
      enabled: Boolean(clientUploads),
      generate: generateUploadInstructions({
        access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
        bucket,
        collectionPrefix: prefix,
        getStorageClient,
        useCompositePrefixes,
      }),
      requiresUploadReceipt: true,
      useInAdmin: true,
    },

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
        buffer: file.buffer,
        client: getStorageClient(),
        mimeType: file.mimeType,
        storageFilePath,
      })

      return data
    },

    staticHandler: (req, { doc, headers, params: { filename, operation, uploadReference } }) =>
      getFile({
        bucket,
        client: getStorageClient(),
        collection,
        collectionPrefix: prefix,
        doc,
        filename,
        incomingHeaders: headers,
        operation,
        req,
        uploadReference,
        useCompositePrefixes,
      }),
  })
}
