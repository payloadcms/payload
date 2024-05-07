import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { UTApi } from 'uploadthing/server'

import { APIError } from 'payload/errors'

import type { ACL } from './index.js'

type HandleUploadArgs = {
  acl: ACL
  utApi: UTApi
}

export const getHandleUpload = ({ acl, utApi }: HandleUploadArgs): HandleUpload => {
  return async ({ data, file }) => {
    try {
      const { buffer, filename, mimeType } = file
      // const fileKey = path.posix.join(data.prefix || prefix, filename)

      const blob = new Blob([buffer], { type: mimeType })

      const res = await utApi.uploadFiles(
        {
          name: filename,
          ...blob,
        },
        { acl },
      )

      if (res.error) {
        throw new APIError(`Error uploading file: ${res.error.code} - ${res.error.message}`)
      }

      data.filename = res.data?.name
      return data
    } catch (error: unknown) {
      throw new APIError(
        `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
