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

  if (!config.upload?.pasteURL) {
    throw new APIError('Pasting from URL is not enabled for this collection.', 400)
  }

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

  if (!req.url) {
    throw new APIError('Request URL is missing.', 400)
  }

  const { searchParams } = new URL(req.url)
  const src = searchParams.get('src')

  if (!src || typeof src !== 'string') {
    throw new APIError('A valid URL string is required.', 400)
  }

  const hasAllowList =
    typeof config.upload.pasteURL === 'object' && Array.isArray(config.upload.pasteURL.allowList)

  let fileURL = new URL(src).href

  if (hasAllowList && !isURLAllowed(fileURL, config.upload.pasteURL.allowList)) {
    throw new APIError('The provided URL is not allowed.', 400)
  }

  let redirectCount = 0
  const maxRedirects = 3
  let response: Response

  while (true) {
    // safeFetch returns undici's Response type which is structurally compatible
    // with, but not assignable to, the global Response type
    response = (await safeFetch(fileURL, {
      headers: {
        'Accept-Encoding': 'identity',
      },
    })) as unknown as Response

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

  const decodedFileName = decodeURIComponent(new URL(fileURL).pathname.split('/').pop() || '')

  return new Response(response.body as null | ReadableStream, {
    headers: {
      'Content-Disposition': `attachment; filename="${decodedFileName}"`,
      'Content-Length': response.headers.get('content-length') || '',
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
    },
  })
}
