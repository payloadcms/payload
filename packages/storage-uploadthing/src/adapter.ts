import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Field } from 'payload'
import type { UTApi } from 'uploadthing/server'

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
        disabled: { bulkEdit: true, column: true, filter: true },
        hidden: true,
      },
    },
  ]

  return (): GeneratedAdapter => ({
    name: 'uploadthing',
    fields,

    uploadInstructions: clientUploads
      ? {
          access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
          generate: () => ({ name: 'uploadToUploadThing', type: 'dispatch' }),
        }
      : undefined,

    generateURL,

    handleDelete: ({ doc, filename, req }) =>
      deleteFile({ doc: doc as unknown as Record<string, unknown>, filename, req, utApi }),

    handleUpload: async ({ clientUploadContext, data, file }) => {
      const result = await uploadFile({
        acl,
        buffer: file.buffer,
        clientUploadContext,
        data,
        filename: file.filename,
        mimeType: file.mimeType,
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
