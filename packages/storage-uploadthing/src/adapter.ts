import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Field } from 'payload'
import type { UTApi } from 'uploadthing/server'

import {
  CLIENT_UPLOAD_CONTEXT_CONTEXT_KEY,
  CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY,
} from 'payload'

import type { ACL } from './index.js'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

interface CreateUploadthingAdapterArgs {
  acl: ACL
  clientUploads?: ClientUploadsConfig
  utApi: UTApi
}

export function createUploadthingAdapter({
  acl,
  clientUploads,
  utApi,
}: CreateUploadthingAdapterArgs): Adapter {
  const fields: Field[] = [
    {
      name: '_key',
      type: 'text',
      admin: {
        disableBulkEdit: true,
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
    },
  ]

  return (): GeneratedAdapter => ({
    name: 'uploadthing',
    clientUploads,
    fields,
    requiresClientUploadReceipt: true,

    generateURL,

    handleDelete: ({ doc, filename, req }) =>
      deleteFile({ doc: doc as unknown as Record<string, unknown>, filename, req, utApi }),

    handleUpload: async ({ clientUploadContext, data, file, req }) => {
      // A processed client upload gets a new key, so the browser upload must be deleted.
      const isProcessedClientUpload =
        Boolean(file.tempFilePath) &&
        file.tempFilePath === req.context?.[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]
      const result = await uploadFile({
        acl,
        buffer: file.buffer,
        clientUploadContext: isProcessedClientUpload
          ? req.context[CLIENT_UPLOAD_CONTEXT_CONTEXT_KEY]
          : clientUploadContext,
        data,
        filename: file.filename,
        mimeType: file.mimeType,
        tempFilePath: file.tempFilePath,
        utApi,
      })

      return result
    },

    staticHandler: (req, { doc, headers, params: { clientUploadContext, collection, filename } }) =>
      getFile({
        clientUploadContext,
        collection,
        doc: doc as unknown as Record<string, unknown> | undefined,
        filename,
        incomingHeaders: headers || new Headers(),
        req,
        utApi,
      }),
  })
}
