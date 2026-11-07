import type { CloudflareImagesBinding } from './types.js'

import {
  MAX_IMAGE_BYTES,
  parseRecord,
  readBody,
  validateOutput,
  validateTransformation,
} from './validation.js'

/**
 * Authenticated, stateless companion endpoint for Payload hosted outside Workers.
 * Never accepts source URLs or writes images to storage. Deploy with an IMAGES
 * binding and a shared secret; the secret must not be sent to browsers.
 */
export function createCloudflareImagesHandler({
  binding,
  token,
}: {
  binding: CloudflareImagesBinding
  token: string
}): (request: Request) => Promise<Response> {
  if (!token.trim() || /[\r\n]/.test(token)) {
    throw new Error('A non-empty Cloudflare Images Worker token is required.')
  }

  return async (request) => {
    if (!(await isAuthenticated({ authorization: request.headers.get('authorization'), token }))) {
      return errorResponse({ status: 401 })
    }
    if (request.method !== 'POST') {
      return new Response(null, { headers: { Allow: 'POST' }, status: 405 })
    }
    const contentType = request.headers.get('content-type')

    if (!contentType?.startsWith('multipart/form-data;')) {
      return errorResponse({ status: 400 })
    }
    let form: FormData

    try {
      const bytes = await readBody({ body: request.body, maxBytes: MAX_IMAGE_BYTES + 65_536 })

      form = await new Response(bytes, { headers: { 'Content-Type': contentType } }).formData()
    } catch {
      return errorResponse({ status: 400 })
    }
    const file = form.get('file')
    const operation = form.get('operation')

    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > MAX_IMAGE_BYTES ||
      !['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      form.getAll('file').length !== 1 ||
      form.getAll('operation').length !== 1
    ) {
      return errorResponse({ status: 400 })
    }
    if (operation === 'info') {
      try {
        return Response.json(await binding.info(file.stream()), {
          headers: { 'Cache-Control': 'private, no-store' },
        })
      } catch {
        return errorResponse({ status: 502 })
      }
    }
    if (operation !== 'transform' || form.getAll('options').length !== 1) {
      return errorResponse({ status: 400 })
    }
    let options: Record<string, unknown>

    try {
      const raw = form.get('options')

      if (typeof raw !== 'string' || raw.length > 8192) {
        return errorResponse({ status: 400 })
      }
      options = parseRecord({ value: JSON.parse(raw) })
      validateOutput({ value: options.output })
      if (!Array.isArray(options.transforms) || options.transforms.length > 4) {
        return errorResponse({ status: 400 })
      }
      for (const transform of options.transforms) {
        validateTransformation({ value: transform })
      }
    } catch {
      return errorResponse({ status: 400 })
    }
    try {
      let handle = binding.input(file.stream())

      for (const transform of options.transforms as Parameters<typeof handle.transform>[0][]) {
        handle = handle.transform(transform)
      }
      const output = await handle.output(options.output as Parameters<typeof handle.output>[0])
      const response = output.response()
      const headers = new Headers(response.headers)

      headers.set('Cache-Control', 'private, no-store')
      return new Response(response.body, { headers, status: response.status })
    } catch {
      return errorResponse({ status: 502 })
    }
  }
}

async function isAuthenticated({
  authorization,
  token,
}: {
  authorization: null | string
  token: string
}): Promise<boolean> {
  const encoder = new TextEncoder()
  const [actual, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(authorization ?? '')),
    crypto.subtle.digest('SHA-256', encoder.encode(`Bearer ${token}`)),
  ])
  const actualBytes = new Uint8Array(actual)
  const expectedBytes = new Uint8Array(expected)
  let difference = 0

  for (let index = 0; index < actualBytes.length; index++) {
    difference |= actualBytes[index]! ^ expectedBytes[index]!
  }

  return difference === 0
}

function errorResponse({ status }: { status: number }): Response {
  return Response.json(
    {
      errors: [{ message: status === 401 ? 'Unauthorized.' : 'Cloudflare Images request failed.' }],
    },
    { headers: { 'Cache-Control': 'private, no-store' }, status },
  )
}
