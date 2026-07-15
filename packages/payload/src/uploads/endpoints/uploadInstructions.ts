import type { Endpoint } from '../../config/types.js'
import type { UploadInstructionsRequest } from '../types.js'

import { APIError } from '../../errors/index.js'

const bytesToMB = (bytes: number) => bytes / 1024 / 1024

export const uploadInstructionsEndpoint: Endpoint = {
  handler: async (req) => {
    if (!req.json) {
      throw new APIError('Content-Type expected to be application/json', 400)
    }

    const upload = (await req.json()) as null | Partial<UploadInstructionsRequest>
    if (
      !upload ||
      typeof upload.collectionSlug !== 'string' ||
      (upload.docPrefix !== undefined && typeof upload.docPrefix !== 'string') ||
      typeof upload.filename !== 'string' ||
      typeof upload.filesize !== 'number' ||
      !Number.isSafeInteger(upload.filesize) ||
      upload.filesize < 0 ||
      typeof upload.mimeType !== 'string'
    ) {
      throw new APIError('Invalid upload instructions request', 400)
    }

    const uploadRequest = upload as UploadInstructionsRequest
    const collection = req.payload.collections[uploadRequest.collectionSlug]
    const uploadInstructions = collection?.config?.upload.uploadInstructions

    if (!collection || !uploadInstructions) {
      throw new APIError(
        `Upload instructions are not configured for ${uploadRequest.collectionSlug}`,
        400,
      )
    }

    const filesizeLimit = req.payload.config.upload.limits?.fileSize
    if (filesizeLimit && uploadRequest.filesize > filesizeLimit) {
      throw new APIError(
        `Exceeded file size limit. Limit: ${bytesToMB(filesizeLimit).toFixed(2)}MB, got: ${bytesToMB(uploadRequest.filesize).toFixed(2)}MB`,
        400,
      )
    }

    return Response.json(await uploadInstructions.generate({ ...uploadRequest, req }))
  },
  method: 'post',
  path: '/upload-instructions',
}
