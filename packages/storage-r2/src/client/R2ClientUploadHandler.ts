'use client'

import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { toast as PayloadToast } from '@payloadcms/ui'

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
    updateFilename,
  }): Promise<R2StorageClientUploadContext | undefined> => {
    const bytesTotal = file.size
    const endpoint = () =>
      `${serverURL}${apiRoute}${serverHandlerPath}?${new URLSearchParams(params)}`
    const params: R2StorageMultipartUploadHandlerParams = {
      collection: collectionSlug,
      fileName: file.name,
      fileType: file.type,
    }

    const toast = PayloadToast.getHistory()[PayloadToast.getHistory().length - 1]?.id
    const toastFormat = (bytes: number) =>
      bytesTotal > 1_000_000_000
        ? `${(bytes / 1_000_000_000).toFixed(1)} GB`
        : bytesTotal > 1_000_000
          ? `${(bytes / 1_000_000).toFixed(1)} MB`
          : bytesTotal > 1_000
            ? `${(bytes / 1_000).toFixed(0)} KB`
            : `${bytes} bytes`
    try {
      const multipart = await fetch(endpoint(), { method: 'POST' })
      if (!multipart.ok) {
        throw new Error('Failed to initialize multipart upload')
      }

      const multipartUpload = (await multipart.json()) as Pick<
        R2MultipartUpload,
        'key' | 'uploadId'
      >
      const multipartUploadedParts: R2UploadedPart[] = []

      params.multipartId = multipartUpload.uploadId
      params.multipartKey = multipartUpload.key

      const partTotal = Math.ceil(file.size / chunkSize)

      for (let part = 1; part <= partTotal; part++) {
        const bytesEnd = Math.min(part * chunkSize, bytesTotal)
        const bytesStart = (part - 1) * chunkSize
        const bytesPercentage = ((bytesStart * 100) / bytesTotal).toFixed(2)

        params.multipartNumber = String(part)

        PayloadToast.loading(
          `Uploading... ${toastFormat(bytesStart)} / ${toastFormat(bytesTotal)} (${bytesPercentage}%)`,
          { id: toast },
        )
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

          PayloadToast.success('Upload complete!', { id: toast })
          return { key: await complete.text() }
        }
      }
    } catch (e) {
      const error = e as Error

      console.error('Upload failed', error)
      PayloadToast.error('Upload failed. Error: ' + error.message, { id: toast })
    }
  },
})
