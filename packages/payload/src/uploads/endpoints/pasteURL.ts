import type { PayloadHandler } from '../../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { APIError } from '../../errors/APIError.js'
import { Forbidden } from '../../errors/Forbidden.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { sanitizeFilename } from '../../utilities/sanitizeFilename.js'
import { fetchWithRedirects } from '../fetchWithRedirects.js'
import { validateUploadURL } from '../validateUploadURL.js'

// If doc id is provided, it means we are updating the doc
// /:collectionSlug/paste-url/:doc-id?src=:fileUrl

// If doc id is not provided, it means we are creating a new doc
// /:collectionSlug/paste-url?src=:fileUrl

export const pasteURLHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req, { optionalID: true })

  if (!req.user) {
    throw new Forbidden(req.t)
  }

  const config = collection?.config

  if (id) {
    // updating doc
    const accessResult = await executeAccess({ slug: config.slug, req }, config.access.update)
    if (!accessResult) {
      throw new Forbidden(req.t)
    }
  } else {
    // creating doc
    const accessResult = await executeAccess({ slug: config.slug, req }, config.access?.create)
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

  const url = validateUploadURL({ uploadConfig: config.upload, url: src })

  const { response, url: resolvedURL } = await fetchWithRedirects({
    allowList: config.upload.pasteURL ? config.upload.pasteURL.allowList : undefined,
    headers: { 'Accept-Encoding': 'identity' },
    timeout: 30_000,
    url: url.href,
  })

  if (!response.ok) {
    throw new APIError('Failed to fetch the file from the provided URL.', response.status)
  }

  const rawFileName = decodeURIComponent(new URL(resolvedURL).pathname.split('/').pop() || '')
  const safeFileName = sanitizeFilename(rawFileName)
  const encodedFileName = encodeURIComponent(safeFileName).replace(
    /['()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )
  // Strip quotes, backslashes, and control chars from the ASCII fallback
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
}
