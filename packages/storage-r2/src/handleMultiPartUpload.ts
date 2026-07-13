import type { PayloadHandler, UploadInstructionsAccess } from 'payload'

import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'

import type { R2StorageOptions } from './index.js'
import type { R2Bucket, R2StorageMultipartUploadHandlerParams } from './types.js'

type Args = {
  access?: UploadInstructionsAccess
  bucket: R2Bucket
  collections: R2StorageOptions['collections']
  useCompositePrefixes?: boolean
}

export const defaultR2ClientUploadsAccess: UploadInstructionsAccess = async ({
  collectionSlug,
  req,
}) => {
  const collection = req.payload.collections[collectionSlug]
  if (!collection?.config) {
    throw new APIError(`Collection ${collectionSlug} not found`)
  }

  const createAccess = collection.config.access?.create
  return createAccess ? Boolean(await createAccess({ req })) : Boolean(req.user)
}

// Adapted from https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/
export const getHandleMultiPartUpload =
  ({
    access = defaultR2ClientUploadsAccess,
    bucket,
    collections,
    useCompositePrefixes = false,
  }: Args): PayloadHandler =>
  async (req) => {
    const params = Object.fromEntries(req.searchParams) as R2StorageMultipartUploadHandlerParams
    const collectionSlug = params.collection
    const filetype = params.fileType

    const collectionConfig = collections[collectionSlug]
    if (!collectionConfig) {
      throw new APIError(`Collection ${collectionSlug} was not found in R2 Storage options`)
    }

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden(req.t)
    }

    const collectionPrefix = (typeof collectionConfig === 'object' && collectionConfig.prefix) || ''
    const { fileKey, sanitizedFilename } = await resolveSignedURLKey({
      collectionPrefix,
      collectionSlug,
      docPrefix: params.docPrefix ?? undefined,
      filename: params.fileName,
      req,
      useCompositePrefixes,
    })

    const multipartId = params.multipartId
    const multipartKey = params.multipartKey
    const multipartNumber = parseInt(params.multipartNumber || '')

    if (multipartId && multipartKey) {
      const multipartUpload = bucket.resumeMultipartUpload(multipartKey, multipartId)
      const request = req as Request

      if (isNaN(multipartNumber)) {
        // Upload complete
        const object = await multipartUpload.complete((await request.json()) as any)
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
      })
    }
  }
