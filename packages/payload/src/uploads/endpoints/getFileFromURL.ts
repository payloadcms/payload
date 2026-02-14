import type { PayloadHandler } from '../../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { APIError } from '../../errors/APIError.js'
import { Forbidden } from '../../errors/Forbidden.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { isURLAllowed } from '../../utilities/isURLAllowed.js'
import { safeFetch } from '../safeFetch.js'

// If doc id is provided, it means we are updating the doc
// /:collectionSlug/paste-url/:doc-id?src=:fileUrl

// If doc id is not provided, it means we are creating a new doc
// /:collectionSlug/paste-url?src=:fileUrl

export const getFileFromURLHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req, { optionalID: true })

  if (!req.user) {
    throw new Forbidden(req.t)
  }

  const config = collection?.config

  if (id) {
    // updating doc
    const accessResult = await executeAccess({ req }, config.access.update)
    if (!accessResult) {
      throw new Forbidden(req.t)
    }
  } else {
    // creating doc
    const accessResult = await executeAccess({ req }, config.access?.create)
    if (!accessResult) {
      throw new Forbidden(req.t)
    }
  }
  try {
    if (!req.url) {
      throw new APIError('Request URL is missing.', 400)
    }

    const { searchParams } = new URL(req.url)
    const src = searchParams.get('src')

    if (!src || typeof src !== 'string') {
      throw new APIError('A valid URL string is required.', 400)
    }

    const validatedUrl = new URL(src)

    if (config.upload?.pasteURL === false) {
      throw new APIError('Pasting URLs is disabled for this collection.', 400)
    }

    if (typeof config.upload?.pasteURL !== 'object') {
      throw new APIError('Server-side URL fetching is not configured for this collection.', 400)
    }

    if (!isURLAllowed(validatedUrl.href, config.upload.pasteURL.allowList)) {
      throw new APIError(`The provided URL (${validatedUrl.href}) is not allowed.`, 400)
    }

    // Fetch the file with no compression
    const response = await safeFetch(validatedUrl.href, {
      headers: {
        'Accept-Encoding': 'identity',
      },
    })

    if (!response.ok) {
      throw new APIError(`Failed to fetch file from ${validatedUrl.href}`, response.status)
    }

    const decodedFileName = decodeURIComponent(validatedUrl.pathname.split('/').pop() || '')
      .replace(/[\r\n]/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')

    const headers: Record<string, string> = {
      'Content-Disposition': `attachment; filename="${decodedFileName || 'file'}"`,
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      headers['Content-Length'] = contentLength
    }

    return new Response(response.body, {
      headers: {
        ...headers,
      },
    })
  } catch (err) {
    if (err instanceof APIError) {
      throw err
    }
    throw new APIError(
      `Error fetching file: ${err instanceof Error ? err.message : 'Unknown error'}`,
      500,
    )
  }
}
