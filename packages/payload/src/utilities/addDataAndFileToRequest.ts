import type { PayloadRequest } from '../types/index.js'
import type { UploadInstructions } from '../uploads/types.js'

import { APIError } from '../errors/APIError.js'
import { processMultipartFormdata } from '../uploads/fetchAPI-multipart/index.js'
import { getFileFromUploadInstructions } from '../uploads/getFileFromUploadInstructions.js'

type AddDataAndFileToRequest = (req: PayloadRequest) => Promise<void>

/**
 * Mutates the Request, appending 'data' and 'file' if found
 */
export const addDataAndFileToRequest: AddDataAndFileToRequest = async (req) => {
  const { body, headers, method, payload } = req

  if (method && ['PATCH', 'POST', 'PUT'].includes(method.toUpperCase()) && body) {
    const [contentType] = (headers.get('Content-Type') || '').split(';', 1)
    const bodyByteSize = parseInt(req.headers.get('Content-Length') || '0', 10)
    const hasBodyStream = req.body !== null

    if (contentType === 'application/json') {
      try {
        const text = await req.text?.()
        const data = text ? JSON.parse(text) : {}
        req.data = data
        // @ts-expect-error attach json method to request
        req.json = () => Promise.resolve(data)
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new APIError('Invalid JSON', 400)
        }
        req.payload.logger.error(error)
        throw error
      }
    } else if ((bodyByteSize || hasBodyStream) && contentType?.includes('multipart/')) {
      const { error, fields, files } = await processMultipartFormdata({
        options: {
          ...(payload.config.bodyParser || {}),
          ...(payload.config.upload || {}),
        },
        request: req as Request,
      })

      if (error) {
        throw new APIError(error.message)
      }

      // Set all files on req.files for access by hooks
      if (files) {
        req.files = files
        // Backwards compatibility: set req.file for standard upload collections
        // Guard: if multiple files share the field name "file", files.file is an array — skip
        if (files.file && !Array.isArray(files.file)) {
          req.file = files.file
        }
      }

      if (fields?._payload && typeof fields._payload === 'string') {
        req.data = JSON.parse(fields._payload)
      }

      if (!req.file && fields?.file && typeof fields?.file === 'string') {
        let uploadedFile: UploadInstructions['file']
        try {
          uploadedFile = JSON.parse(fields.file)
        } catch {
          throw new APIError('A file name is required.', 400)
        }
        const collectionSlug =
          typeof req.routeParams?.collection === 'string'
            ? req.routeParams.collection
            : uploadedFile.collectionSlug
        const uploadConfig = collectionSlug
          ? req.payload.collections[collectionSlug]?.config.upload
          : undefined

        if (!collectionSlug || !uploadConfig) {
          throw new APIError('Invalid upload collection.', 400)
        }

        req.file = await getFileFromUploadInstructions({
          collectionSlug,
          file: uploadedFile,
          req,
        })
      }
    }
  }
}
