import type { UploadTransformer } from 'payload'

/**
 * Call counters for the fake transformers below, reset by each test that needs
 * them. Each transformer's `canTransform` recognizes its own dedicated query
 * parameter so a single collection/MIME type can exercise every pipeline shape
 * from `test/upload-transformers/int.spec.ts` without needing a transformer per
 * collection.
 */
export const transformerCallCounts = {
  appendSuffix: 0,
  consumeWithoutResponse: 0,
  noop: 0,
  redirect: 0,
  sourceConsumingError: 0,
  throwing: 0,
  uppercase: 0,
}

export function resetTransformerCallCounts(): void {
  for (const key of Object.keys(transformerCallCounts) as (keyof typeof transformerCallCounts)[]) {
    transformerCallCounts[key] = 0
  }
}

/**
 * Counts `TransformerMedia` collection hook invocations, so a test can prove a
 * dynamic-transform request never enters the document-mutation pipeline.
 */
export const transformerMediaHookCallCounts = {
  afterChange: 0,
  beforeChange: 0,
  beforeDelete: 0,
}

export function resetTransformerMediaHookCallCounts(): void {
  for (const key of Object.keys(
    transformerMediaHookCallCounts,
  ) as (keyof typeof transformerMediaHookCallCounts)[]) {
    transformerMediaHookCallCounts[key] = 0
  }
}

const hasQueryParam = (paramName: string) => (args: { req: { searchParams?: URLSearchParams } }) =>
  args.req.searchParams?.has(paramName) ?? false

export const appendSuffixTransformer: UploadTransformer = {
  slug: 'append-suffix',
  canTransform: hasQueryParam('suffix'),
  handleRequest: async ({ getSourceFile }) => {
    transformerCallCounts.appendSuffix += 1
    const source = await getSourceFile()
    const text = await source.text()
    return {
      response: new Response(`${text}-suffix`, { headers: source.headers }),
      status: 'continue',
    }
  },
  mimeTypes: ['application/pdf'],
}

export const uppercaseTransformer: UploadTransformer = {
  slug: 'uppercase',
  canTransform: hasQueryParam('uppercase'),
  handleRequest: async ({ getSourceFile }) => {
    transformerCallCounts.uppercase += 1
    const source = await getSourceFile()
    const text = await source.text()
    return {
      response: new Response(text.toUpperCase(), { headers: source.headers }),
      status: 'complete',
    }
  },
  mimeTypes: ['application/pdf'],
}

export const redirectTransformer: UploadTransformer = {
  slug: 'redirect',
  canTransform: hasQueryParam('redirect'),
  handleRequest: () => {
    transformerCallCounts.redirect += 1
    return Promise.resolve({
      response: Response.redirect('https://example.com/redirected', 302),
      status: 'complete',
    })
  },
  mimeTypes: ['application/pdf'],
}

export const noopTransformer: UploadTransformer = {
  slug: 'noop',
  canTransform: hasQueryParam('noop'),
  handleRequest: () => {
    transformerCallCounts.noop += 1
    return Promise.resolve({ status: 'continue' })
  },
  mimeTypes: ['application/pdf'],
}

export const throwingTransformer: UploadTransformer = {
  slug: 'throw',
  canTransform: hasQueryParam('throwerror'),
  handleRequest: () => {
    transformerCallCounts.throwing += 1
    throw new Error('fake transformer failure')
  },
  mimeTypes: ['application/pdf'],
}

export const sourceConsumingErrorTransformer: UploadTransformer = {
  slug: 'source-error',
  canTransform: hasQueryParam('sourceerror'),
  handleRequest: async ({ getSourceFile }) => {
    transformerCallCounts.sourceConsumingError += 1
    await getSourceFile()
    throw new Error('fake failure after consuming the source')
  },
  mimeTypes: ['application/pdf'],
}

export const consumeWithoutResponseTransformer: UploadTransformer = {
  slug: 'consume-without-response',
  canTransform: hasQueryParam('consumenoresponse'),
  handleRequest: async ({ getSourceFile }) => {
    transformerCallCounts.consumeWithoutResponse += 1
    await getSourceFile()
    return { status: 'continue' }
  },
  mimeTypes: ['application/pdf'],
}

/**
 * Opt-in: replaces Sharp with Cloudinary for image uploads and for dynamic resizing on
 * `resize-preview-media` (see `config.ts`). Cloudinary fetches the source itself, so it also needs a publicly reachable
 * server URL (e.g. a tunnel) - `CLOUDINARY_URL` alone is not enough, and gating on it
 * would silently switch every local run that loads the repo root `.env`.
 *
 * To run the dev server with Cloudinary (`CLOUDINARY_URL` set in the repo root `.env`):
 *
 *   1. Start a tunnel to the port the dev server will use, and copy the printed
 *      `https://<random>.trycloudflare.com` URL:
 *        npx cloudflared tunnel --url http://localhost:3100
 *   2. Start the dev server on that port with the tunnel URL:
 *        PORT=3100 PAYLOAD_PUBLIC_SERVER_URL=https://<random>.trycloudflare.com pnpm run dev upload-transformers
 *      If the port is taken, the dev server silently moves to the next free one - check the
 *      port it logs matches the tunnel.
 *   3. Upload an image to "Resize Preview Media" and use "Preview resize".
 *
 * The same env runs the e2e suite against Cloudinary:
 *   PORT=3100 PAYLOAD_PUBLIC_SERVER_URL=https://<random>.trycloudflare.com pnpm test:e2e upload-transformers
 *
 * If your Cloudinary account restricts fetched URLs, allow-list the tunnel host.
 */
export const publicServerURL = process.env.PAYLOAD_PUBLIC_SERVER_URL

export const isCloudinaryEnabled = Boolean(process.env.CLOUDINARY_URL && publicServerURL)

export const testTransformers: UploadTransformer[] = [
  appendSuffixTransformer,
  uppercaseTransformer,
  redirectTransformer,
  noopTransformer,
  throwingTransformer,
  sourceConsumingErrorTransformer,
  consumeWithoutResponseTransformer,
]
