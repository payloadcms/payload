'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { genUploader } from 'uploadthing/client'

export const UploadthingClientUploadHandler = createClientUploadHandler({
  handler: async ({ apiRoute, collectionSlug, file, serverURL }) => {
    const { uploadFiles } = genUploader({
      package: 'storage-uploadthing',
      url: `${serverURL}${apiRoute}/storage-uploadthing-client-upload-route?collectionSlug=${collectionSlug}`,
    })

    const res = await uploadFiles('uploader', {
      files: [file],
    })

    return { key: res[0].key }
  },
})
