import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

// /api/paste-url/:fileUrl

type WrapperRequest = {
  req: PayloadRequest
}

const getRequestFromPayload = (wrapperReq: WrapperRequest): PayloadRequest => {
  return wrapperReq.req
}

export const getFileFromURL = async (wrapperReq: WrapperRequest) => {
  try {
    const request = getRequestFromPayload(wrapperReq)

    if (!request.url) {
      throw new APIError('Request URL is missing.', 400)
    }

    const { searchParams } = new URL(request.url)
    let src = searchParams.get('src')

    if (!src || typeof src !== 'string') {
      throw new APIError('A valid URL string is required.', 400)
    }

    src = decodeURIComponent(src)
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

    // Return the raw response
    return new Response(response.body, {
      headers: {
        'Content-Length': response.headers.get('content-length') || '',
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      },
    })
  } catch (error) {
    throw new APIError(`Error fetching file: ${error.message}`, 500)
  }
}
