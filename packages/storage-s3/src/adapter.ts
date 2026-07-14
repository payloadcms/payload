import type { S3, S3ClientConfig } from '@aws-sdk/client-s3'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { SignedDownloadsConfig } from './getFile.js'

import { generateURL } from './generateURL.js'

interface CreateS3AdapterArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  cacheControl?: string
  clientUploads?: ClientUploadsConfig
  config: S3ClientConfig
  getStorageClient: () => S3
  signedDownloads: SignedDownloadsConfig
  useCompositePrefixes?: boolean
}

export function createS3Adapter({
  acl,
  bucket,
  cacheControl,
  clientUploads,
  config,
  getStorageClient,
  signedDownloads,
  useCompositePrefixes = false,
}: CreateS3AdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 's3',
    clientUploads,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        bucket,
        collectionPrefix: prefix,
        endpoint: config.endpoint,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    // Helpers below dynamic-import their @aws-sdk dependencies so the SDK only
    // loads on the first request that actually needs it.
    handleDelete: async ({ doc: { prefix: docPrefix = '' }, filename }) => {
      const { deleteFile } = await import('./deleteFile.js')
      return deleteFile({
        bucket,
        client: getStorageClient(),
        collectionPrefix: prefix,
        docPrefix,
        filename,
        useCompositePrefixes,
      })
    },

    handleUpload: async ({ data, file }) => {
      const { uploadFile } = await import('./uploadFile.js')
      await uploadFile({
        acl,
        bucket,
        buffer: file.buffer,
        cacheControl,
        client: getStorageClient(),
        collectionPrefix: prefix,
        docPrefix: data.prefix,
        filename: file.filename,
        mimeType: file.mimeType,
        tempFilePath: file.tempFilePath,
        useCompositePrefixes,
      })

      return data
    },

    staticHandler: async (
      req,
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) => {
      const { getFile } = await import('./getFile.js')
      return getFile({
        bucket,
        client: getStorageClient(),
        clientUploadContext,
        collection,
        collectionPrefix: prefix,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        signedDownloads,
        useCompositePrefixes,
      })
    },
  })
}
