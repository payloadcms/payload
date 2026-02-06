import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { UTApi } from 'uploadthing/server'

import { APIError } from 'payload'
import { UTFile } from 'uploadthing/server'

import type { ACL } from './index.js'

type HandleUploadArgs = {
  acl: ACL
  utApi: UTApi
}

export const getHandleUpload = ({ acl, utApi }: HandleUploadArgs): HandleUpload => {
  return async ({ clientUploadContext, data, file }) => {
    try {
      if (
        clientUploadContext &&
        typeof clientUploadContext === 'object' &&
        'key' in clientUploadContext &&
        typeof clientUploadContext.key === 'string'
      ) {
        // Clear the old file
        await utApi.deleteFiles(clientUploadContext.key)
      }

      const { buffer, filename, mimeType } = file

      const blob = new Blob([buffer], { type: mimeType })
      const res = await utApi.uploadFiles(new UTFile([blob], filename), { acl })

      if (res.error) {
        throw new APIError(`Error uploading file: ${res.error.code} - ${res.error.message}`)
      }

      // Find matching data.sizes entry
      const foundSize = Object.keys(data.sizes || {}).find(
        (key) => data.sizes?.[key]?.filename === filename,
      )

      if (foundSize) {
        data.sizes[foundSize]._key = res.data?.key
      } else {
        data._key = res.data?.key
        data.filename = res.data?.name
      }

      return data
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Interrogate uploadthing error which returns FiberFailure
        if ('toJSON' in error && typeof error.toJSON === 'function') {
          const json = error.toJSON() as {
            cause?: { defect?: { _id?: string; data?: { error?: string }; error?: string } }
          }
          if (json.cause?.defect?.error && json.cause.defect.data?.error) {
            throw new APIError(
              `Error uploading file with uploadthing: ${json.cause.defect.error} - ${json.cause.defect.data.error}`,
            )
          }
        } else {
          throw new APIError(`Error uploading file with uploadthing: ${error.message}`)
        }
      }
    }
  }
}
