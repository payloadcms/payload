'use client'

import { createClientUploadHandler, uploadRequest } from '@payloadcms/plugin-cloud-storage/client'
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
    onProgress,
    props: { chunkSize = 5 * 1024 * 1024 },
    serverURL,
    updateFilename,
  }): Promise<R2StorageUploadReference | undefined> => {
    const params: R2StorageMultipartUploadHandlerParams = {
      collection: collectionSlug,
      docPrefix,
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

    const {
      filename: sanitizedFilename,
      uploadReference,
      ...multipartUpload
    } = (await multipart.json()) as {
      filename?: string
      uploadReference: R2StorageUploadReference
    } & Pick<R2MultipartUpload, 'key' | 'uploadId'>

    if (sanitizedFilename && sanitizedFilename !== file.name) {
      updateFilename(sanitizedFilename)
    }

    const multipartUploadedParts: R2UploadedPart[] = []

    params.multipartId = multipartUpload.uploadId
    params.multipartKey = multipartUpload.key
    params.signedReceipt = uploadReference.signedReceipt

    const partTotal = Math.ceil(file.size / chunkSize)
    let completedBytes = 0

    for (let part = 1; part <= partTotal; part++) {
      const bytesEnd = Math.min(part * chunkSize, file.size)
      const bytesStart = (part - 1) * chunkSize

      params.multipartNumber = String(part)

      const body = file.slice(bytesStart, bytesEnd)
      // The browser sets Content-Length from the body.
      const headers = { 'Content-Type': 'application/octet-stream' }
      // Parts upload one after another, so progress is the finished parts plus the current one.
      const uploaded = await uploadRequest({
        body,
        headers,
        method: 'POST',
        onProgress: ({ loadedBytes }) =>
          onProgress({ loadedBytes: completedBytes + loadedBytes, totalBytes: file.size }),
        url: getEndpoint(),
      })
      if (!uploaded.ok) {
        throw new Error(`Failed to upload part ${part} / ${partTotal}`)
      }

      completedBytes += body.size

      multipartUploadedParts.push((await uploaded.json()) as R2UploadedPart)

      if (part === partTotal) {
        delete params.multipartNumber

        const body = JSON.stringify(multipartUploadedParts)
        const headers = { 'Content-Type': 'application/json' }
        const complete = await fetch(getEndpoint(), { body, headers, method: 'POST' })
        if (!complete.ok) {
          throw new Error(`Failed to complete multipart upload`)
        }

        return { prefix: uploadReference.prefix, signedReceipt: uploadReference.signedReceipt }
      }
    }
  },
})
