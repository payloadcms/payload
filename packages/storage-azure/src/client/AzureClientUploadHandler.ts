'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

import { handleAzureUpload } from './handleAzureUpload.js'

export const AzureClientUploadHandler = createClientUploadHandler({
  name: 'uploadToAzure',
  handler: handleAzureUpload,
})
