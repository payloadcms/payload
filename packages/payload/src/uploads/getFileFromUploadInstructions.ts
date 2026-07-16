import type { PayloadRequest } from '../types/index.js'
import type { UploadInstructions } from './types.js'

import { APIError } from '../errors/APIError.js'
import { getStagedFile } from './stagedUpload.js'

export const getFileFromUploadInstructions = async ({
  collectionSlug,
  file,
  req,
}: {
  collectionSlug: string
  file: UploadInstructions['file']
  req: PayloadRequest
}): Promise<NonNullable<PayloadRequest['file']>> => {
  if (
    !file ||
    typeof file !== 'object' ||
    !file.uploadReference ||
    typeof file.uploadReference !== 'object'
  ) {
    throw new APIError('Invalid upload reference.', 400)
  }

  /**
   * Handlers fetch files uploaded to a storage provider. An uploadId points to a temporary file
   * already stored by Payload, so no handler is needed.
   */
  if ('uploadId' in file.uploadReference) {
    return getStagedFile({ collectionSlug, req, uploadReference: file.uploadReference })
  }

  const uploadConfig = req.payload.collections[collectionSlug]!.config.upload

  if (!uploadConfig || !uploadConfig.handlers) {
    throw new APIError('uploadConfig.handlers is not present for ' + collectionSlug)
  }

  let response: null | Response = null
  let error: unknown

  for (const handler of uploadConfig.handlers) {
    try {
      const result = await handler(req, {
        doc: null!,
        params: {
          collection: collectionSlug,
          filename: file.filename,
          uploadReference: file.uploadReference,
        },
      })
      if (result) {
        response = result
        /**
         * - If a handler returns a Response, the response will be sent to the client and no further handlers will be run.
         * - If a handler returns null, the next handler will be run.
         *
         * @see packages/payload/src/uploads/types.ts
         */
        break
      }
    } catch (err) {
      error = err
    }
  }

  if (!response) {
    if (error) {
      req.payload.logger.error(error)
    }

    throw new APIError('Expected response from the upload handler.')
  }

  if (response.status >= 300 && response.status < 400) {
    const redirectUrl = response.headers.get('Location')
    if (redirectUrl) {
      response = await fetch(redirectUrl)
    }
  }

  return {
    name: file.filename,
    data: Buffer.from(await response.arrayBuffer()),
    mimetype: response.headers.get('Content-Type') || file.mimeType,
    size: file.size,
    uploadReference: file.uploadReference,
  }
}
