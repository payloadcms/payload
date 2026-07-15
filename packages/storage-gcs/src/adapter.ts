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

    uploadInstructions: clientUploads
      ? {
          generate: generateUploadInstructions({
            access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
            bucket,
            collectionPrefix: prefix,
            getStorageClient,
            useCompositePrefixes,
          }),
        }
      : undefined,

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({
        bucket,
        client: getStorageClient(),
        collectionPrefix: prefix,
        docPrefix,
        filename,
        useCompositePrefixes,
      }),

    handleUpload: async ({ data, file }) => {
      await uploadFile({
        acl,
        bucket,
        buffer: file.buffer,
        client: getStorageClient(),
        collectionPrefix: prefix,
        docPrefix: data.prefix,
        filename: file.filename,
        mimeType: file.mimeType,
        useCompositePrefixes,
      })

      return data
    },

    staticHandler: (
      req,
      { headers, params: { filename, prefix: prefixQueryParam, uploadReference } },
    ) =>
      getFile({
        bucket,
        client: getStorageClient(),
        collection,
        collectionPrefix: prefix,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        uploadReference,
        useCompositePrefixes,
      }),
  })
}
