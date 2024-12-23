import type { Collection, GlobalConfig, PayloadRequest, TypeWithID } from 'payload'

import { APIError, executeAccess, Forbidden } from 'payload'

// /api/paste-url/:fileUrl

// /:collectionSlug/paste-url/:fileUrl

// /:globalSlug/paste-url/:fileUrl

export const getFileFromURL = async ({
  collection,
  docID,
  global,
  req,
}: {
  collection?: Collection
  docID: number | string // global slug OR docID
  filename: string
  global?: GlobalConfig
  req: PayloadRequest
}): Promise<Response | TypeWithID> => {
  if (!req.user) {
    throw new Forbidden(req.t)
  }

  const config = collection?.config || global

  if (docID) {
    // updating doc
    const accessResult = await executeAccess({ req }, config.access.update)
    if (!accessResult) {
      throw new Forbidden(req.t)
    }
  } else if (collection) {
    // creating doc (only applicable to collections)
    const accessResult = await executeAccess({ req }, collection.config.access?.create)
    if (!accessResult) {
      throw new Forbidden(req.t)
    }
  } else {
    throw new APIError('Invalid operation: creating is not allowed.', 400)
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
