'use client'

import { createClientUploadHandler, getFileKey } from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'

import type {
  R2MultipartUpload,
  R2StorageClientUploadHandlerParams,
  R2StorageMultipartUploadHandlerParams,
  R2StorageUploadReference,
  R2UploadedPart,
} from '../types.js'

export const R2ClientUploadHandler = createClientUploadHandler<R2StorageClientUploadHandlerParams>({
  name: 'uploadToR2',
  handler: async ({
    apiRoute,
    collectionSlug,
    docPrefix,
    endpointPath,
    file,
    prefix,
    props: { chunkSize = 5 * 1024 * 1024 },
    serverURL,
    updateFilename,
  }): Promise<R2StorageUploadReference | undefined> => {
    const { sanitizedDocPrefix } = getFileKey({
      collectionPrefix: prefix,
      docPrefix,
      filename: file.name,
    })

    const params: R2StorageMultipartUploadHandlerParams = {
      collection: collectionSlug,
      docPrefix: sanitizedDocPrefix,
      fileName: file.name,
      fileType: file.type,
    }
    const baseURL = formatAdminURL({
      apiRoute,
      path: endpointPath,
      serverURL,
    })

    const getEndpoint = () => `${baseURL}?${String(new URLSearchParams(params))}`

    // Initialize the multipart upload.
    const multipart = await fetch(getEndpoint(), { method: 'POST' })
    if (!multipart.ok) {
      throw new Error('Failed to initialize multipart upload')
    }

    const { filename: sanitizedFilename, ...multipartUpload } = (await multipart.json()) as {
      filename?: string
    } & Pick<R2MultipartUpload, 'key' | 'uploadId'>

    if (sanitizedFilename && sanitizedFilename !== file.name) {
      updateFilename(sanitizedFilename)
    }

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
      const uploaded = await fetch(getEndpoint(), { body, headers, method: 'POST' })
      if (!uploaded.ok) {
        throw new Error(`Failed to upload part ${part} / ${partTotal}`)
      }

      multipartUploadedParts.push((await uploaded.json()) as R2UploadedPart)

      if (part === partTotal) {
        delete params.multipartNumber

        const body = JSON.stringify(multipartUploadedParts)
        const headers = { 'Content-Type': 'application/json' }
        const complete = await fetch(getEndpoint(), { body, headers, method: 'POST' })
        if (!complete.ok) {
          throw new Error(`Failed to complete multipart upload`)
        }

        const key = await complete.text()
        return {
          key,
          prefix: sanitizedDocPrefix,
        }
      }
    }
  },
})
