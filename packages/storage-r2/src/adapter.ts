import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { R2StorageOptions } from './index.js'
import type { R2Bucket } from './types.js'

import { deleteFile } from './deleteFile.js'
import { getFile } from './getFile.js'
import { defaultR2ClientUploadsAccess, getHandleMultiPartUpload } from './handleMultiPartUpload.js'
import { uploadFile } from './uploadFile.js'

interface CreateR2AdapterArgs {
  bucket: R2Bucket
  clientUploads?: ClientUploadsConfig
  collections: R2StorageOptions['collections']
  useCompositePrefixes?: boolean
}

export function createR2Adapter({
  bucket,
  clientUploads,
  collections,
  useCompositePrefixes = false,
}: CreateR2AdapterArgs): Adapter {
  const access =
    typeof clientUploads === 'object' && clientUploads.access
      ? clientUploads.access
      : defaultR2ClientUploadsAccess
  const uploadInstructions: GeneratedAdapter['uploadInstructions'] = clientUploads
    ? {
        adminHandler: {
          path: '@payloadcms/storage-r2/client#R2ClientUploadHandler',
        },
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
            uploadReference: {},
            filename,
            mimeType,
            size: filesize,
          },
        }),
      }
    : undefined

  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'r2',
    uploadInstructions,

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
      { headers, params: { filename, prefix: prefixQueryParam, uploadReference } },
    ) =>
      getFile({
        bucket,
        collection,
        uploadReference,
        filename,
        incomingHeaders: headers,
        prefix,
        prefixQueryParam,
        req,
        useCompositePrefixes,
      }),
  })
}
