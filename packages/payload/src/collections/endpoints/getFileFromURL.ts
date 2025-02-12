// @ts-strict-ignore
import type { PayloadHandler } from '../../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { APIError } from '../../errors/APIError.js'
import { Forbidden } from '../../errors/Forbidden.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { isURLAllowed } from '../../utilities/isURLAllowed.js'

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

    if (
      typeof config.upload?.pasteURL === 'object' &&
      !isURLAllowed(validatedUrl.href, config.upload.pasteURL.allowList)
    ) {
      throw new APIError(`The provided URL (${validatedUrl.href}) is not allowed.`, 400)
    }

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
