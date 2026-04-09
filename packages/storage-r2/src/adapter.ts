import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { R2Bucket } from './types.js'

import { deleteFile } from './handleDelete.js'
import { uploadFile } from './handleUpload.js'
import { getFile } from './staticHandler.js'

interface CreateR2AdapterArgs {
  bucket: R2Bucket
  clientUploads?: ClientUploadsConfig
}

export function createR2Adapter({ bucket, clientUploads }: CreateR2AdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'r2',
    clientUploads,

    handleDelete: async ({ doc: { prefix: docPrefix = '' }, filename }) =>
      await deleteFile({ bucket, filename, prefix: docPrefix }),

    handleUpload: async ({ data, file }) =>
      await uploadFile({
        bucket,
        buffer: file.buffer,
        filename: file.filename,
        mimeType: file.mimeType,
        prefix: data.prefix || prefix,
      }),

    staticHandler: async (
      req,
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) =>
      await getFile({
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
