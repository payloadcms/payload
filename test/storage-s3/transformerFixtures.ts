import type { UploadTransformer } from 'payload'

import { createHash } from 'crypto'

/**
 * Reads the real source bytes via `getSourceFile()` and echoes their SHA-256
 * hash back as a response header, proving `operation: 'transform'`
 * retrieval bypasses S3 signed-download redirects and returns the actual
 * object body — not a `302` — even when `signedDownloads` is enabled.
 */
export const proveSourceHashTransformer: UploadTransformer = {
  slug: 'prove-source-hash',
  mimeTypes: ['image/*'],
  canTransform: ({ req }) => req.searchParams?.has('proveSourceHash') ?? false,
  handleRequest: async ({ getSourceFile }) => {
    const source = await getSourceFile()
    const bytes = Buffer.from(await source.arrayBuffer())
    const hash = createHash('sha256').update(bytes).digest('hex')

    return {
      response: new Response(bytes, {
        headers: { ...Object.fromEntries(source.headers), 'X-Source-Hash': hash },
        status: source.status,
      }),
      status: 'complete',
    }
  },
}
