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
}

export function createR2Adapter({ bucket, clientUploads }: CreateR2AdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'r2',
    clientUploads,

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({ bucket, filename, prefix: docPrefix }),

    handleUpload: ({ data, file }) =>
      uploadFile({
        bucket,
        buffer: file.buffer,
        filename: file.filename,
        mimeType: file.mimeType,
        prefix: data.prefix || prefix,
      }),

    staticHandler: (
      req,
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) =>
      getFile({
        bucket,
        clientUploadContext,
        collection,
        filename,
        incomingHeaders: headers,
        prefix,
        prefixQueryParam,
        req,
      }),
  })
}
