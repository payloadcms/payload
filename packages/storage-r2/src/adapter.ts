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

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({
        bucket,
        collectionPrefix: prefix,
        docPrefix,
        filename,
        useCompositePrefixes,
      }),

    handleUpload: ({ data, file }) =>
      uploadFile({
        bucket,
        buffer: file.buffer,
        collectionPrefix: prefix,
        docPrefix: data.prefix,
        filename: file.filename,
        mimeType: file.mimeType,
        useCompositePrefixes,
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
        useCompositePrefixes,
      }),
  })
}
