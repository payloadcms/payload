'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

import { handleAzureUpload } from './handleAzureUpload.js'

export const AzureClientUploadHandler = createClientUploadHandler({
  handler: async ({
    apiRoute,
    collectionSlug,
    docPrefix,
    file,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    return handleAzureUpload({
      apiRoute,
      collectionSlug,
      docPrefix,
      file,
      serverHandlerPath,
      serverURL,
      updateFilename,
    })
  },
})
