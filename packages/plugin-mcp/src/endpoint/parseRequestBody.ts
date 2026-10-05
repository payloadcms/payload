import {
  DEFAULT_MAX_REQUEST_BODY_SIZE,
  isJsonContentType,
  readRequestBody,
} from '@modelcontextprotocol/server'

type ParsedRequestBody = { parsedBody: unknown } | { response: Response }

/**
 * Reads the original body once, enforcing the SDK limit before passing parsed JSON
 * to either transport. Rejects failures here so the SDK never rereads the body.
 */
export const parseRequestBody = async ({
  maxRequestBodySize = DEFAULT_MAX_REQUEST_BODY_SIZE,
  request,
}: {
  maxRequestBodySize?: number
  request: Request
}): Promise<ParsedRequestBody> => {
  if (request.method.toUpperCase() !== 'POST') {
    return { parsedBody: undefined }
  }

  let text: string

  try {
    const body = await readRequestBody(request, maxRequestBodySize)

    if (body.tooLarge) {
      return rejectBody({
        message: `Payload Too Large: Request body must not exceed ${maxRequestBodySize} bytes`,
        request,
        status: 413,
      })
    }

    text = body.text
  } catch {
    return rejectBody({
      message: 'Parse error: the request body could not be read',
      request,
      status: 400,
    })
  }

  try {
    return { parsedBody: JSON.parse(text) }
  } catch {
    // The SDK classifies invalid/empty JSON as legacy, whose Accept check comes first.
    const accept = request.headers.get('accept')

    if (!accept?.includes('application/json') || !accept.includes('text/event-stream')) {
      return {
        response: jsonError({
          code: -32000,
          message: 'Not Acceptable: Client must accept both application/json and text/event-stream',
          status: 406,
        }),
      }
    }

    return rejectBody({ message: 'Parse error: Invalid JSON', request, status: 400 })
  }
}

const rejectBody = ({
  message,
  request,
  status,
}: {
  message: string
  request: Request
  status: 400 | 413
}): { response: Response } => {
  // Preserve the SDK's Content-Type rejection before its body-size/parse errors.
  if (!isJsonContentType(request.headers.get('content-type'))) {
    return {
      response: jsonError({
        code: -32000,
        message: 'Unsupported Media Type: Content-Type must be application/json',
        status: 415,
      }),
    }
  }

  return { response: jsonError({ code: status === 413 ? -32000 : -32700, message, status }) }
}

const jsonError = ({
  code,
  message,
  status,
}: {
  code: number
  message: string
  status: number
}): Response => Response.json({ id: null, error: { code, message }, jsonrpc: '2.0' }, { status })
