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

    const response = await fetch(validatedUrl.href)

    if (!response.ok) {
      throw new APIError(`Failed to fetch file from ${validatedUrl.href}`, response.status)
    }

    return response
  } catch (error) {
    throw new APIError(`Error fetching file: ${error.message}`, 500)
  }
}
