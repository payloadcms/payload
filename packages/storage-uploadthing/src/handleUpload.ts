import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { UTApi } from 'uploadthing/server'

import { APIError } from 'payload/errors'
import { UTFile } from 'uploadthing/server'

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
      const res = await utApi.uploadFiles(new UTFile([blob], filename), { acl })

      if (res.error) {
        throw new APIError(`Error uploading file: ${res.error.code} - ${res.error.message}`)
      }

      /**
       * {
          key: "26afa85a-85fc-458c-981f-f6d2fe7b2d67-1nq2cb.png",
          url: "https://utfs.io/f/26afa85a-85fc-458c-981f-f6d2fe7b2d67-1nq2cb.png",
          name: "image.png",
          size: 89728,
          type: "image/png",
          customId: null,
        }
       */

      // Find matching data.sizes entry and set filename
      const foundSize = Object.keys(data.sizes || {}).find(
        (key) => data.sizes?.[key]?.filename === filename,
      )

      if (foundSize) {
        data.sizes[foundSize].filename = res.data?.key
        if (acl === 'public-read') {
          data.sizes[foundSize].url = res.data?.url
        }
      } else {
        data.filename = res.data?.key
        if (acl === 'public-read') {
          data.url = res.data?.url
        }
      }

      return data
    } catch (error: unknown) {
      throw new APIError(
        `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
