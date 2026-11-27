'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

import { handleVercelBlobUpload } from './handleVercelBlobUpload.js'

export const VercelBlobClientUploadHandler = createClientUploadHandler({
  name: 'uploadToVercelBlob',
  handler: handleVercelBlobUpload,
})
