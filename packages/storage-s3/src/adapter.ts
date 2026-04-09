import type * as AWS from '@aws-sdk/client-s3'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { SignedDownloadsConfig } from './staticHandler.js'

import { generateURL } from './generateURL.js'
import { deleteFile } from './handleDelete.js'
import { uploadFile } from './handleUpload.js'
import { getFile } from './staticHandler.js'

interface CreateS3AdapterArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  clientUploads?: ClientUploadsConfig
  config: AWS.S3ClientConfig
  getStorageClient: () => AWS.S3
  signedDownloads: SignedDownloadsConfig
}

export function createS3Adapter({
  acl,
  bucket,
  clientUploads,
  config,
  getStorageClient,
  signedDownloads,
}: CreateS3AdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 's3',
    clientUploads,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({ bucket, endpoint: config.endpoint, filename, prefix: urlPrefix }),

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({ bucket, client: getStorageClient(), filename, prefix: docPrefix }),

    handleUpload: async ({ data, file }) => {
      await uploadFile({
        acl,
        bucket,
        buffer: file.buffer,
        client: getStorageClient(),
        filename: file.filename,
        mimeType: file.mimeType,
        prefix: data.prefix || prefix,
        tempFilePath: file.tempFilePath,
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
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        signedDownloads,
      }),
  })
}
