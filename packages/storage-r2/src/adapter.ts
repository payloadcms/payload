import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { R2StorageOptions } from './index.js'
import type { R2Bucket } from './types.js'

import { deleteFile } from './deleteFile.js'
import { getFile } from './getFile.js'
import { getHandleMultiPartUpload } from './handleMultiPartUpload.js'
import { uploadFile } from './uploadFile.js'

interface CreateR2AdapterArgs {
  bucket: R2Bucket
  clientUploads?: ClientUploadsConfig
  collections: R2StorageOptions['collections']
  copyCredentials?: R2StorageOptions['copyCredentials']
  useCompositePrefixes?: boolean
}

export function createR2Adapter({
  bucket,
  clientUploads,
  collections,
  copyCredentials,
  useCompositePrefixes = false,
}: CreateR2AdapterArgs): Adapter {
  const access = typeof clientUploads === 'object' ? clientUploads.access : undefined
  const uploadInstructions: GeneratedAdapter['uploadInstructions'] = {
    adminHandler: {
      path: '@payloadcms/storage-r2/client#R2ClientUploadHandler',
    },
    enabled: Boolean(clientUploads),
    endpoint: {
      handler: getHandleMultiPartUpload({
        access,
        bucket,
        collections,
        useCompositePrefixes,
      }),
      path: '/storage-r2-multi-part-upload',
    },
    generate: ({ filename, filesize, mimeType }) => ({
      name: 'uploadToR2',
      type: 'dispatch',
      file: {
        filename,
        mimeType,
        size: filesize,
        uploadReference: {},
      },
    }),
    requiresUploadReceipt: true,
    useInAdmin: true,
  }

  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'r2',
    uploadInstructions,

    copyFile: async ({ from, to }) => {
      if (!copyCredentials) {
        throw new Error('R2 file copy requires S3 API credentials')
      }

      const [{ S3 }, { copyS3File }] = await Promise.all([
        import('@aws-sdk/client-s3'),
        import('@payloadcms/storage-s3/copy-file'),
      ])
      const client = new S3({
        credentials: {
          accessKeyId: copyCredentials.accessKeyId,
          secretAccessKey: copyCredentials.secretAccessKey,
        },
        endpoint: `https://${copyCredentials.accountId}.r2.cloudflarestorage.com`,
        region: 'auto',
      })

      try {
        await copyS3File({ bucket: copyCredentials.bucket, client, from, to })
      } finally {
        client.destroy()
      }
    },

    handleDelete: ({ storageFilePath }) =>
      deleteFile({
        bucket,
        storageFilePath,
      }),

    handleUpload: ({ file, storageFilePath }) =>
      uploadFile({
        bucket,
        buffer: file.buffer,
        mimeType: file.mimeType,
        storageFilePath,
      }),

    staticHandler: (req, { doc, headers, params: { filename, operation, uploadReference } }) =>
      getFile({
        bucket,
        collection,
        doc,
        filename,
        incomingHeaders: headers,
        operation,
        prefix,
        req,
        uploadReference,
        useCompositePrefixes,
      }),
  })
}
