import type { Storage } from '@google-cloud/storage'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { generateURL } from './generateURL.js'
import { deleteFile } from './handleDelete.js'
import { uploadFile } from './handleUpload.js'
import { getFile } from './staticHandler.js'

interface CreateGcsAdapterArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  clientUploads?: ClientUploadsConfig
  getStorageClient: () => Storage
}

export function createGcsAdapter({
  acl,
  bucket,
  clientUploads,
  getStorageClient,
}: CreateGcsAdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'gcs',
    clientUploads,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({ bucket, client: getStorageClient(), filename, prefix: urlPrefix }),

    handleDelete: async ({ doc: { prefix: docPrefix = '' }, filename }) =>
      await deleteFile({ bucket, client: getStorageClient(), filename, prefix: docPrefix }),

    handleUpload: async ({ data, file }) => {
      await uploadFile({
        acl,
        bucket,
        buffer: file.buffer,
        client: getStorageClient(),
        filename: file.filename,
        mimeType: file.mimeType,
        prefix: data.prefix || prefix,
      })

      return data
    },

    staticHandler: async (
      req,
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) =>
      await getFile({
        bucket,
        client: getStorageClient(),
        clientUploadContext,
        collection,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
      }),
  })
}
