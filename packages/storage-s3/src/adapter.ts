import type * as AWS from '@aws-sdk/client-s3'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { SignedDownloadsConfig } from './getFile.js'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

interface CreateS3AdapterArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  clientUploads?: ClientUploadsConfig
  config: AWS.S3ClientConfig
  getStorageClient: () => AWS.S3
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
    clientUploads,
    requiresClientUploadReceipt: true,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        bucket,
        collectionPrefix: prefix,
        endpoint: config.endpoint,
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
        buffer: file.buffer,
        client: getStorageClient(),
        mimeType: file.mimeType,
        storageFilePath,
        tempFilePath: file.tempFilePath,
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
        signedDownloads,
        useCompositePrefixes,
      }),
  })
}
