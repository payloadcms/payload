import type { Endpoint } from '../../config/types.js'
import type { UploadInstructionsRequest } from '../types.js'

import { APIError } from '../../errors/index.js'

const bytesToMB = (bytes: number) => bytes / 1024 / 1024

const isUploadInstructionsRequest = (upload: unknown): upload is UploadInstructionsRequest =>
  typeof upload === 'object' &&
  upload !== null &&
  'collectionSlug' in upload &&
  typeof upload.collectionSlug === 'string' &&
  (!('docPrefix' in upload) ||
    upload.docPrefix === undefined ||
    typeof upload.docPrefix === 'string') &&
  'filename' in upload &&
  typeof upload.filename === 'string' &&
  'filesize' in upload &&
  typeof upload.filesize === 'number' &&
  Number.isSafeInteger(upload.filesize) &&
  upload.filesize >= 0 &&
  'mimeType' in upload &&
  typeof upload.mimeType === 'string'

export const uploadInstructionsEndpoint: Endpoint = {
  handler: async (req) => {
    if (!req.json) {
      throw new APIError('Content-Type expected to be application/json', 400)
    }

    const upload: unknown = await req.json()
    if (!isUploadInstructionsRequest(upload)) {
      throw new APIError('Invalid upload instructions request', 400)
    }

    const collection = req.payload.collections[upload.collectionSlug]
    const uploadInstructions = collection?.config?.upload?.uploadInstructions

    if (!collection || !uploadInstructions) {
      throw new APIError(`Upload instructions are not configured for ${upload.collectionSlug}`, 400)
    }

    const filesizeLimit = req.payload.config.upload.limits?.fileSize
    if (filesizeLimit && upload.filesize > filesizeLimit) {
      throw new APIError(
        `Exceeded file size limit. Limit: ${bytesToMB(filesizeLimit).toFixed(2)}MB, got: ${bytesToMB(upload.filesize).toFixed(2)}MB`,
        400,
      )
    }

    return Response.json(await uploadInstructions.generate({ ...upload, req }))
  },
  method: 'post',
  path: '/upload-instructions',
}
