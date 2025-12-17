'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { formatApiURL } from 'payload/shared'
import { genUploader } from 'uploadthing/client'

export const UploadthingClientUploadHandler = createClientUploadHandler({
  handler: async ({ apiRoute, collectionSlug, file, serverHandlerPath }) => {
    const endpointRoute = formatApiURL({
      apiRoute,
      path: `${serverHandlerPath}?collectionSlug=${collectionSlug}`,
    })
    const { uploadFiles } = genUploader({
      package: 'storage-uploadthing',
      url: endpointRoute,
    })

    const res = await uploadFiles('uploader', {
      files: [file],
    })

    return { key: res[0]?.key }
  },
})
