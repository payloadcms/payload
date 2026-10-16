import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { R2Bucket } from './types.js'

import { deleteFile } from './deleteFile.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

interface CreateR2AdapterArgs {
  bucket: R2Bucket
  clientUploads?: ClientUploadsConfig
  useCompositePrefixes?: boolean
}

export function createR2Adapter({
  bucket,
  clientUploads,
  useCompositePrefixes = false,
}: CreateR2AdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'r2',
    clientUploads,
    requiresClientUploadReceipt: true,

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

    staticHandler: (req, { doc, headers, params: { clientUploadContext, filename } }) =>
      getFile({
        bucket,
        clientUploadContext,
        collection,
        doc,
        filename,
        incomingHeaders: headers,
        prefix,
        req,
        useCompositePrefixes,
      }),
  })
}
