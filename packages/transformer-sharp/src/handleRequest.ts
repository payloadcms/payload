import type { HandleTransformRequestArgs, HandleTransformRequestResult } from 'payload'
import type { SharpOptions } from 'sharp'

import type { SharpDependency, SharpDynamicDefaults } from './types.js'

import { parseDynamicResize } from './parseDynamicResize.js'

// Matches core's existing `generateFileData.ts` allow-list for upload-time processing —
// Sharp only auto-detects and preserves multi-frame animation for these MIME types.
const ANIMATED_MIME_TYPES = ['image/avif', 'image/gif', 'image/webp']

/**
 * Builds the request-time `handleRequest` stage: parses and validates the v1
 * dynamic parameters (`width`, `height`, `withoutEnlargement`), retrieves the
 * source exactly once — only after validation passes — and resizes it while
 * preserving the source format. Unexpected Sharp errors are left to propagate
 * uncaught; Payload's orchestrator logs and aborts the pipeline.
 */
export function createHandleRequest({
  dynamicDefaults,
  sharpDependency,
}: {
  dynamicDefaults: Required<SharpDynamicDefaults>
  sharpDependency: SharpDependency
}): (args: HandleTransformRequestArgs) => Promise<HandleTransformRequestResult> {
  return async ({ getSourceFile, mimeType, req }) => {
    const parseResult = parseDynamicResize({
      limits: dynamicDefaults,
      searchParams: req.searchParams ?? new URLSearchParams(),
    })

    if (!parseResult.isRouted) {
      return { status: 'continue' }
    }

    if (!parseResult.valid) {
      return {
        response: Response.json({ errors: [{ message: parseResult.error }] }, { status: 400 }),
        status: 'complete',
      }
    }

    if (req.headers?.get('range')) {
      return { response: new Response(null, { status: 416 }), status: 'complete' }
    }

    const source = await getSourceFile()

    if (!source.ok) {
      return { response: source, status: 'complete' }
    }

    const sourceBuffer = Buffer.from(await source.arrayBuffer())

    const sharpOptions: SharpOptions = ANIMATED_MIME_TYPES.includes(mimeType)
      ? { animated: true }
      : {}

    const resizedBuffer = await sharpDependency(sourceBuffer, sharpOptions)
      .resize({
        fit: dynamicDefaults.fit,
        height: parseResult.height,
        position: dynamicDefaults.position,
        width: parseResult.width,
        withoutEnlargement: parseResult.withoutEnlargement ?? dynamicDefaults.withoutEnlargement,
      })
      .toBuffer()

    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', String(resizedBuffer.length))

    return {
      response: new Response(req.method === 'HEAD' ? null : resizedBuffer, {
        headers,
        status: 200,
      }),
      status: 'continue',
    }
  }
}
