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

    uploadInstructions: clientUploads
      ? {
          generate: generateUploadInstructions({
            access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
            acl,
            bucket,
            collectionPrefix: prefix,
            getStorageClient,
            useCompositePrefixes,
          }),
        }
      : undefined,

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
      { headers, params: { directUpload, filename, prefix: prefixQueryParam } },
    ) => {
      const { getFile } = await import('./getFile.js')
      return getFile({
        bucket,
        client: getStorageClient(),
        collection,
        collectionPrefix: prefix,
        directUpload,
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
