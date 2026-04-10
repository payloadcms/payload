import type { UTApi } from 'uploadthing/server'

import { APIError } from 'payload'
import { UTFile } from 'uploadthing/server'

import type { ACL } from './index.js'

interface UploadFileArgs {
  acl: ACL
  buffer: Buffer
  clientUploadContext?: unknown
  data: Record<string, unknown>
  filename: string
  mimeType: string
  utApi: UTApi
}

export async function uploadFile({
  acl,
  buffer,
  clientUploadContext,
  data,
  filename,
  mimeType,
  utApi,
}: UploadFileArgs): Promise<Record<string, unknown>> {
  try {
    if (
      clientUploadContext &&
      typeof clientUploadContext === 'object' &&
      'key' in clientUploadContext &&
      typeof clientUploadContext.key === 'string'
    ) {
      await utApi.deleteFiles(clientUploadContext.key)
    }

    const blob = new Blob([buffer], { type: mimeType })
    const res = await utApi.uploadFiles(new UTFile([blob], filename), { acl })

    if (res.error) {
      throw new APIError(`Error uploading file: ${res.error.code} - ${res.error.message}`)
    }

    const sizes = data.sizes as Record<string, { _key?: string; filename?: string }> | undefined
    const foundSize = Object.keys(sizes || {}).find((key) => sizes?.[key]?.filename === filename)

    if (foundSize && sizes && sizes[foundSize]) {
      sizes[foundSize]._key = res.data?.key
    } else {
      data._key = res.data?.key
      data.filename = res.data?.name
    }

    return data
  } catch (error: unknown) {
    if (error instanceof APIError) {
      throw error
    }

    if (error instanceof Error) {
      if ('toJSON' in error && typeof error.toJSON === 'function') {
        const json = error.toJSON() as {
          cause?: { defect?: { _id?: string; data?: { error?: string }; error?: string } }
        }
        if (json.cause?.defect?.error && json.cause.defect.data?.error) {
          throw new APIError(
            `Error uploading file with uploadthing: ${json.cause.defect.error} - ${json.cause.defect.data.error}`,
          )
        }
      }
      throw new APIError(`Error uploading file with uploadthing: ${error.message}`)
    }

    throw new APIError('Error uploading file with uploadthing: Unknown error')
  }
}
