'use client'

import type { ClientUploadContext } from '@payloadcms/plugin-cloud-storage/types'

import {
  buildUploadStoragePathData,
  createClientUploadHandler,
} from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'

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
    docPrefix,
    extra: { chunkSize = 5 * 1024 * 1024, useCompositePrefixes = false },
    file,
    prefix,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }): Promise<R2StorageClientUploadContext | undefined> => {
    const { sanitizedDocPrefix } = buildUploadStoragePathData({
      collectionPrefix: prefix,
      docPrefix,
      filename: file.name,
      useCompositePrefixes,
    })

    const params: R2StorageMultipartUploadHandlerParams = {
      collection: collectionSlug,
      docPrefix: sanitizedDocPrefix,
      fileName: file.name,
      fileType: file.type,
    }
    const baseURL = formatAdminURL({
      apiRoute,
      path: serverHandlerPath,
      serverURL,
    })

    const getEndpoint = () => `${baseURL}?${String(new URLSearchParams(params))}`

    // upload the file directly to R2 using the signed URL
    const multipart = await fetch(getEndpoint(), { method: 'POST' })
    if (!multipart.ok) {
      throw new Error('Failed to initialize multipart upload')
    }

    const {
      clientUploadContext,
      filename: sanitizedFilename,
      ...multipartUpload
    } = (await multipart.json()) as {
      clientUploadContext: ClientUploadContext
      filename?: string
    } & Pick<R2MultipartUpload, 'key' | 'uploadId'>

    if (sanitizedFilename && sanitizedFilename !== file.name) {
      updateFilename(sanitizedFilename)
    }

    const multipartUploadedParts: R2UploadedPart[] = []

    params.multipartId = multipartUpload.uploadId
    params.multipartKey = multipartUpload.key
    params.signedReceipt = clientUploadContext.signedReceipt

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
          prefix: clientUploadContext.prefix,
          signedReceipt: clientUploadContext.signedReceipt,
        }
      }
    }
  },
})
