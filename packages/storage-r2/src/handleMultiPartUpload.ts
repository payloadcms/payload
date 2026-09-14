import type { PayloadHandler, UploadInstructionsAccess } from 'payload'

import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'
import {
  assertClientUploadAccess,
  assertClientUploadAllowed,
  verifyClientUploadReceipt,
} from 'payload/internal'

import type { R2StorageOptions } from './index.js'
import type { R2Bucket, R2StorageMultipartUploadHandlerParams, R2UploadedPart } from './types.js'

type Args = {
  access?: UploadInstructionsAccess
  bucket: R2Bucket
  collections: R2StorageOptions['collections']
  useCompositePrefixes?: boolean
}

// Adapted from https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/
export const getHandleMultiPartUpload =
  ({ access, bucket, collections, useCompositePrefixes = false }: Args): PayloadHandler =>
  async (req) => {
    const params = Object.fromEntries(req.searchParams) as R2StorageMultipartUploadHandlerParams
    const collectionSlug = params.collection
    const filetype = params.fileType

    await assertClientUploadAccess({ collectionSlug, req })

    const collectionConfig = collections[collectionSlug]
    if (!collectionConfig) {
      throw new APIError(`Collection ${collectionSlug} was not found in R2 Storage options`)
    }

    if (access && !(await access({ collectionSlug, req }))) {
      throw new Forbidden(req.t)
    }

    assertClientUploadAllowed({
      collection: req.payload.collections[collectionSlug]?.config,
      filename: params.fileName,
      mimeType: filetype,
    })

    const multipartId = params.multipartId
    const multipartKey = params.multipartKey
    const multipartNumber = parseInt(params.multipartNumber || '')
    const collectionPrefix = (typeof collectionConfig === 'object' && collectionConfig.prefix) || ''

    if (multipartId && multipartKey) {
      const receipt = verifyClientUploadReceipt({
        collectionSlug,
        req,
        signedReceipt: params.signedReceipt,
      })
      // The receipt binds the full storage key (including the per-upload _objectKey segment), so
      // compare against it directly rather than recomputing from prefix + filename.
      if (receipt.fileKey !== multipartKey) {
        throw new APIError('Invalid upload reference.', 400)
      }
      const multipartUpload = bucket.resumeMultipartUpload(multipartKey, multipartId)
      const request = req as Request

      if (isNaN(multipartNumber)) {
        // Upload complete
        const object = await multipartUpload.complete((await request.json()) as R2UploadedPart[])
        return new Response(object.key, { status: 200 })
      } else {
        // Upload part
        const uploadedPart = await multipartUpload.uploadPart(
          multipartNumber,
          await request.arrayBuffer(),
        )
        return Response.json(uploadedPart)
      }
    } else {
      const { fileKey, sanitizedFilename, uploadReference } = await resolveSignedURLKey({
        collectionPrefix,
        collectionSlug,
        docPrefix: params.docPrefix ?? undefined,
        filename: params.fileName,
        req,
        useCompositePrefixes,
      })
      const existing = await bucket.head(fileKey)
      if (existing) {
        return new Response('Object already exists', { status: 412 })
      }

      // Create multipart upload
      const multipartUpload = await bucket.createMultipartUpload(fileKey, {
        httpMetadata: {
          contentType: filetype,
        },
      })

      return Response.json({
        filename: sanitizedFilename,
        key: multipartUpload.key,
        uploadId: multipartUpload.uploadId,
        uploadReference,
      })
    }
  }
