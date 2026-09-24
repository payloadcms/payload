'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

import { handleAzureUpload } from './handleAzureUpload.js'

export type AzureClientUploadHandlerExtra = {
  chunkLargeFiles: boolean
}

export const AzureClientUploadHandler = createClientUploadHandler<AzureClientUploadHandlerExtra>({
  handler: async ({
    apiRoute,
    collectionSlug,
    docPrefix,
    extra: { chunkLargeFiles },
    file,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    return handleAzureUpload({
      apiRoute,
      chunkLargeFiles,
      collectionSlug,
      docPrefix,
      file,
      serverHandlerPath,
      serverURL,
      updateFilename,
    })
  },
})
