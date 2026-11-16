'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'
import { genUploader } from 'uploadthing/client'

export const UploadthingClientUploadHandler = createClientUploadHandler({
  handler: async ({
    apiRoute,
    collectionSlug,
    file,
    serverHandlerPath,
    serverURL,
  }): Promise<{ key: string; signedReceipt: string }> => {
    const endpointRoute = formatAdminURL({
      apiRoute,
      path: `${serverHandlerPath}?collectionSlug=${collectionSlug}`,
      serverURL,
    })
    const { uploadFiles } = genUploader({
      package: 'storage-uploadthing',
      url: endpointRoute,
    })

    const res = await uploadFiles('uploader', {
      files: [file],
    })

    const uploaded = res[0]
    if (!uploaded?.serverData?.signedReceipt) {
      throw new Error('Uploadthing did not return a client upload receipt')
    }

    return { key: uploaded.key, signedReceipt: uploaded.serverData.signedReceipt }
  },
})
