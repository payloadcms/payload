'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

import type { R2StorageClientUploadHandlerParams } from '../types.js'

import { handleR2Upload } from './handleR2Upload.js'

export const R2ClientUploadHandler = createClientUploadHandler<R2StorageClientUploadHandlerParams>({
  name: 'uploadToR2',
  handler: handleR2Upload,
})
