import type { CloudflareImageInfo, CloudflareTransport, ImagesClient } from './types.js'

import {
  assertPositiveInteger,
  MAX_IMAGE_BYTES,
  parseRecord,
  readBody,
  validateOutput,
  validateTransformation,
} from './validation.js'

export function createImagesClient({
  transport,
}: {
  transport: CloudflareTransport
}): ImagesClient {
  if (transport.mode === 'binding') {
    if (!transport.binding) {
      throw new Error('A Cloudflare Images binding is required.')
    }
    const getBinding = async ({ req }: Parameters<ImagesClient['info']>[0]) =>
      typeof transport.binding === 'function' ? transport.binding({ req }) : transport.binding

    return {
      info: async (args) => {
        assertInput({ file: args.file })
        const binding = await getBinding(args)

        return binding.info(args.file.stream())
      },
      transform: async (args) => {
        assertInput({ file: args.file })
        validateOutput({ value: args.output })
        const binding = await getBinding(args)
        let handle = binding.input(args.file.stream())

        for (const transform of args.transforms) {
          validateTransformation({ value: transform })
          handle = handle.transform(transform)
        }
        const result = await handle.output(args.output)

        return normalizeResponse({ format: args.output.format, response: result.response() })
      },
    }
  }
  const url = new URL(transport.url)

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    !transport.token.trim() ||
    /[\r\n]/.test(transport.token)
  ) {
    throw new Error('Cloudflare remote transport requires an HTTPS URL and a non-empty token.')
  }
  const timeout = transport.timeout ?? 30_000

  assertPositiveInteger({ name: 'Cloudflare remote timeout', value: timeout })
  const fetch = transport.fetch ?? globalThis.fetch
  const send = async ({
    file,
    operation,
    options,
  }: {
    file: File
    operation: 'info' | 'transform'
    options?: unknown
  }) => {
    assertInput({ file })
    const form = new FormData()

    form.set('file', file)
    form.set('operation', operation)
    if (options) {
      form.set('options', JSON.stringify(options))
    }
    const response = await fetch(url, {
      body: form,
      headers: { Authorization: `Bearer ${transport.token}` },
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(timeout),
    })

    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`Cloudflare Images request failed (${response.status}).`)
    }

    return response
  }

  return {
    info: async ({ file }) => {
      const response = await send({ file, operation: 'info' })
      const bytes = await readBody({ body: response.body, maxBytes: 4096 })
      const info = parseRecord({ value: JSON.parse(new TextDecoder().decode(bytes)) })
      if (info.format !== 'image/svg+xml') {
        assertPositiveInteger({ name: 'Cloudflare image width', value: info.width })
        assertPositiveInteger({ name: 'Cloudflare image height', value: info.height })
        if (
          typeof info.format !== 'string' ||
          typeof info.fileSize !== 'number' ||
          !Number.isFinite(info.fileSize) ||
          info.fileSize < 0
        ) {
          throw new Error('Cloudflare Images returned invalid image metadata.')
        }
      }

      return info as CloudflareImageInfo
    },
    transform: async ({ file, output, transforms }) => {
      validateOutput({ value: output })
      for (const transform of transforms) {
        validateTransformation({ value: transform })
      }
      const response = await send({ file, operation: 'transform', options: { output, transforms } })

      return normalizeResponse({ format: output.format, response })
    },
  }
}

async function normalizeResponse({
  format,
  response,
}: {
  format: string
  response: Response
}): Promise<Response> {
  if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== format) {
    await response.body?.cancel()
    throw new Error('Cloudflare Images returned an invalid transformation response.')
  }
  const bytes = await readBody({ body: response.body })

  return new Response(bytes, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Length': String(bytes.length),
      'Content-Type': format,
    },
  })
}

function assertInput({ file }: { file: File }): void {
  if (file.size > MAX_IMAGE_BYTES || file.size === 0) {
    throw new Error('Cloudflare Images requires a non-empty image of at most 20 MiB.')
  }
}
