'use client'

import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

import type {
  R2MultipartUpload,
  R2StorageClientUploadContext,
  R2StorageClientUploadHandlerParams,
  R2StorageMultipartUploadHandlerParams,
  R2UploadedPart,
} from '../types.js'

export const R2ClientUploadHandler = createClientUploadHandler<R2StorageClientUploadHandlerParams>({
  handler: async ({
    apiRoute,
    collectionSlug,
    extra: { chunkSize = 5 * 1024 * 1024, prefix = '' },
    file,
    serverHandlerPath,
    serverURL,
  }): Promise<R2StorageClientUploadContext | undefined> => {
    const endpoint = () =>
      `${serverURL}${apiRoute}${serverHandlerPath}?${new URLSearchParams(params)}`
    const params: R2StorageMultipartUploadHandlerParams = {
      collection: collectionSlug,
      fileName: file.name,
      fileType: file.type,
    }

    const multipart = await fetch(endpoint(), { method: 'POST' })
    if (!multipart.ok) {
      throw new Error('Failed to initialize multipart upload')
    }

    const multipartUpload = (await multipart.json()) as Pick<R2MultipartUpload, 'key' | 'uploadId'>
    const multipartUploadedParts: R2UploadedPart[] = []

    params.multipartId = multipartUpload.uploadId
    params.multipartKey = multipartUpload.key

    const partTotal = Math.ceil(file.size / chunkSize)

    for (let part = 1; part <= partTotal; part++) {
      const bytesEnd = Math.min(part * chunkSize, file.size)
      const bytesStart = (part - 1) * chunkSize

      params.multipartNumber = String(part)

      const body = file.slice(bytesStart, bytesEnd)
      const headers = {
        'Content-Length': String(body.size),
        'Content-Type': 'application/octet-stream',
      }
      const uploaded = await fetch(endpoint(), { body, headers, method: 'POST' })
      if (!uploaded.ok) {
        throw new Error(`Failed to upload part ${part} / ${partTotal}`)
      }

      multipartUploadedParts.push((await uploaded.json()) as R2UploadedPart)

      if (part === partTotal) {
        delete params.multipartNumber

        const body = JSON.stringify(multipartUploadedParts)
        const headers = { 'Content-Type': 'application/json' }
        const complete = await fetch(endpoint(), { body, headers, method: 'POST' })
        if (!complete.ok) {
          throw new Error(`Failed to complete multipart upload`)
        }

        const key = await complete.text()
        return { key }
      }
    }
  },
})
