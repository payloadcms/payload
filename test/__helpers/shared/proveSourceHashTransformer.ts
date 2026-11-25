import type { UploadTransformer } from 'payload'

import { createHash } from 'crypto'

export const proveSourceHashParam = 'proveSourceHash'

/**
 * Reads the real source bytes via `getSourceFile()` and echoes their SHA-256
 * hash back as a response header, proving `operation: 'transform'` retrieval
 * returns the actual object body rather than whatever the adapter would send
 * a browser (signed-download redirect, 304, 416, rewritten headers).
 *
 * Lives apart from `transformSourceTests.ts` because configs import it, and
 * configs must load outside Vitest (e.g. `pnpm dev:generate-types`).
 */
export const proveSourceHashTransformer: UploadTransformer = {
  slug: 'prove-source-hash',
  canTransform: ({ req }) => req.searchParams?.has(proveSourceHashParam) ?? false,
  handleRequest: async ({ getSourceFile }) => {
    const source = await getSourceFile()
    const bytes = Buffer.from(await source.arrayBuffer())
    const hash = createHash('sha256').update(bytes).digest('hex')

    return {
      response: new Response(bytes, {
        headers: {
          ...Object.fromEntries(source.headers),
          'X-Source-Hash': hash,
        },
        status: source.status,
      }),
      status: 'complete',
    }
  },
  mimeTypes: ['image/*'],
}
