import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import type { Field } from 'payload'
import type { UTApi } from 'uploadthing/server'

import type { ACL, UploadthingStorageOptions } from './index.js'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getClientUploadRoute } from './getClientUploadRoute.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

interface CreateUploadthingAdapterArgs {
  acl: ACL
  clientUploads?: UploadthingStorageOptions['clientUploads']
  token?: string
  utApi: UTApi
}

export function createUploadthingAdapter({
  acl,
  clientUploads,
  token,
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
  const uploadInstructions: GeneratedAdapter['uploadInstructions'] = clientUploads
    ? {
        adminHandler: {
          path: '@payloadcms/storage-uploadthing/client#UploadthingClientUploadHandler',
        },
        endpoint: {
          handler: getClientUploadRoute({
            access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
            acl,
            routerInputConfig:
              typeof clientUploads === 'object' ? clientUploads.routerInputConfig : undefined,
            token,
          }),
          path: '/storage-uploadthing-client-upload-route',
        },
        generate: ({ filename, filesize, mimeType }) => ({
          name: 'uploadToUploadThing',
          type: 'dispatch',
          file: {
            directUpload: {},
            filename,
            mimeType,
            size: filesize,
          },
        }),
      }
    : undefined

  return (): GeneratedAdapter => ({
    name: 'uploadthing',
    fields,
    uploadInstructions,

    generateURL,

    handleDelete: ({ doc, filename, req }) =>
      deleteFile({ doc: doc as unknown as Record<string, unknown>, filename, req, utApi }),

    handleUpload: async ({ data, file }) => {
      const result = await uploadFile({
        acl,
        buffer: file.buffer,
        data,
        filename: file.filename,
        mimeType: file.mimeType,
        utApi,
      })

      return result
    },

    staticHandler: (req, { doc, headers, params: { collection, directUpload, filename } }) =>
      getFile({
        collection,
        directUpload,
        doc: doc as unknown as Record<string, unknown> | undefined,
        filename,
        incomingHeaders: headers || new Headers(),
        req,
        utApi,
      }),
  })
}
