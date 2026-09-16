import type { S3, S3ClientConfig } from '@aws-sdk/client-s3'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { SignedDownloadsConfig } from './getFile.js'

import { generateUploadInstructions } from './generateUploadInstructions.js'
import { generateURL } from './generateURL.js'

interface CreateS3AdapterArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  clientUploads?: ClientUploadsConfig
  config: S3ClientConfig
  getStorageClient: () => S3
  signedDownloads: SignedDownloadsConfig
  useCompositePrefixes?: boolean
}

export function createS3Adapter({
  acl,
  bucket,
  clientUploads,
  config,
  getStorageClient,
  signedDownloads,
  useCompositePrefixes = false,
}: CreateS3AdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 's3',

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        bucket,
        collectionPrefix: prefix,
        endpoint: config.endpoint,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    uploadInstructions: {
      enabled: Boolean(clientUploads),
      generate: generateUploadInstructions({
        access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
        acl,
        bucket,
        collectionPrefix: prefix,
        getStorageClient,
        useCompositePrefixes,
      }),
      requiresUploadReceipt: true,
      useInAdmin: true,
    },

    // Helpers below dynamic-import their @aws-sdk dependencies so the SDK only
    // loads on the first request that actually needs it.
    handleDelete: async ({ storageFilePath }) => {
      const { deleteFile } = await import('./deleteFile.js')
      return deleteFile({
        bucket,
        client: getStorageClient(),
        storageFilePath,
      })
    },

    handleUpload: async ({ data, file, storageFilePath }) => {
      const { uploadFile } = await import('./uploadFile.js')
      await uploadFile({
        acl,
        bucket,
        buffer: file.buffer,
        client: getStorageClient(),
        mimeType: file.mimeType,
        storageFilePath,
        tempFilePath: file.tempFilePath,
      })

      return data
    },

    staticHandler: async (req, { doc, headers, params: { filename, uploadReference } }) => {
      const { getFile } = await import('./getFile.js')
      return getFile({
        bucket,
        client: getStorageClient(),
        collection,
        collectionPrefix: prefix,
        doc,
        filename,
        incomingHeaders: headers,
        req,
        signedDownloads,
        uploadReference,
        useCompositePrefixes,
      })
    },
  })
}
