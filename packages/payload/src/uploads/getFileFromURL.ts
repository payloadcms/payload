import type { Collection, TypeWithID } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import executeAccess from '../auth/executeAccess.js'
import { APIError } from '../errors/APIError.js'
import { Forbidden } from '../errors/Forbidden.js'

// If doc id is provided, it means we are updating the doc
// /:collectionSlug/:doc-id/paste-url/:fileUrl

// If doc id is not provided, it means we are creating a new doc
// /:collectionSlug/paste-url/:fileUrl

export const getFileFromURL = async ({
  id,
  collection,
  req,
}: {
  collection?: Collection
  id?: number | string
  req: PayloadRequest
}): Promise<Response | TypeWithID> => {
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

    // Fetch the file with no compression
    const response = await fetch(validatedUrl.href, {
      headers: {
        'Accept-Encoding': 'identity',
      },
    })

    if (!response.ok) {
      throw new APIError(`Failed to fetch file from ${validatedUrl.href}`, response.status)
    }

    const decodedFileName = decodeURIComponent(validatedUrl.pathname.split('/').pop() || '')

    return new Response(response.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${decodedFileName}"`,
        'Content-Length': response.headers.get('content-length') || '',
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      },
    })
  } catch (error) {
    throw new APIError(`Error fetching file: ${error.message}`, 500)
  }
}
