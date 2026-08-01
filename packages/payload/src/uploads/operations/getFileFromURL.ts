import { z } from 'zod'

import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { APIError, Forbidden } from '../../errors/index.js'
import { defineOperation } from '../../operations/defineOperation.js'
import { collectionSchema, idSchema, requestSchema } from '../../operations/schemaFields.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { isURLAllowed } from '../../utilities/isURLAllowed.js'
import { sanitizeFilename } from '../../utilities/sanitizeFilename.js'
import { safeFetch } from '../safeFetch.js'

type GetFileFromURLInput = {
  collection: string
  id?: number | string
  req: PayloadRequest
  src: string
}

const getFileFromURLSchema = z.looseObject({
  id: idSchema.optional(),
  collection: collectionSchema,
  req: requestSchema,
  src: z.url().describe('The URL to fetch'),
})

export const getFileFromURL = defineOperation({
  action: 'getFileFromURL',
  expose: {
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const { id, collection } = getRequestCollectionWithID(req, { optionalID: true })

          if (!req.url) {
            throw new APIError('Request URL is missing.', 400)
          }

          const src = new URL(req.url).searchParams.get('src')
          if (!src) {
            throw new APIError('A valid URL string is required.', 400)
          }

          return invoke({
            context: req.payload,
            input: {
              id,
              collection: collection.config.slug,
              req,
              src,
            },
            validate: false,
          })
        },
        method: 'get',
        path: '/paste-url/:id?',
      },
    ],
  },
  handler: async (
    payload: Payload,
    { id, collection: collectionSlug, req, src }: GetFileFromURLInput,
  ): Promise<Response> => {
    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(`Collection ${collectionSlug} was not found`, 400)
    }
    if (!req.user) {
      throw new Forbidden(req.t)
    }

    const config = collection.config
    if (!config.upload?.pasteURL) {
      throw new APIError('Pasting from URL is not enabled for this collection.', 400)
    }

    const accessResult = await executeAccess(
      { req },
      id ? config.access.update : config.access.create,
    )
    if (!accessResult) {
      throw new Forbidden(req.t)
    }

    const hasAllowList =
      typeof config.upload.pasteURL === 'object' && Array.isArray(config.upload.pasteURL.allowList)

    let fileURL: string
    try {
      fileURL = new URL(src).href
    } catch {
      throw new APIError('A valid URL string is required.', 400)
    }

    if (hasAllowList && !isURLAllowed(fileURL, config.upload.pasteURL.allowList)) {
      throw new APIError('The provided URL is not allowed.', 400)
    }

    let redirectCount = 0
    const maxRedirects = 3
    let response!: Response

    while (true) {
      if (hasAllowList && isURLAllowed(fileURL, config.upload.pasteURL.allowList)) {
        response = await fetch(fileURL, {
          headers: { 'Accept-Encoding': 'identity' },
          redirect: 'manual',
          signal: AbortSignal.timeout(30_000),
        })
      } else {
        response = await safeFetch(fileURL, {
          headers: { 'Accept-Encoding': 'identity' },
          signal: AbortSignal.timeout(30_000),
        })
      }

      if (response.status >= 300 && response.status < 400) {
        redirectCount++
        if (redirectCount > maxRedirects) {
          throw new APIError('Too many redirects.', 403)
        }

        const location = response.headers.get('location')
        if (location) {
          fileURL = new URL(location, fileURL).href
          if (hasAllowList && !isURLAllowed(fileURL, config.upload.pasteURL.allowList)) {
            throw new APIError('The provided URL is not allowed.', 400)
          }
          continue
        }
      }

      break
    }

    if (!response.ok) {
      throw new APIError('Failed to fetch the file from the provided URL.', response.status)
    }

    const rawFileName = decodeURIComponent(new URL(fileURL).pathname.split('/').pop() || '')
    const safeFileName = sanitizeFilename(rawFileName)
    const encodedFileName = encodeURIComponent(safeFileName).replace(
      /['()]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    const asciiFileName = safeFileName.replace(/["\\\r\n]/g, '_')
    const headers: Record<string, string> = {
      'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
    }
    const contentLength = response.headers.get('content-length')

    if (contentLength) {
      headers['Content-Length'] = contentLength
    }

    return new Response(response.body, { headers })
  },
  input: getFileFromURLSchema,
  target: 'uploadCollection',
})
