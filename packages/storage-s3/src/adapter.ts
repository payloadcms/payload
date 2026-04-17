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

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        bucket,
        collectionPrefix: prefix,
        endpoint: config.endpoint,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

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
        tempFilePath: file.tempFilePath,
        useCompositePrefixes,
      })

      return data
    },

    staticHandler: (
      req,
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) =>
      getFile({
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
      }),
  })
}
