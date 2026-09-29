import type { HandleTransformRequestArgs, HandleTransformRequestResult } from 'payload'
import type { SharpOptions } from 'sharp'

import type { SharpDependency, SharpDynamicDefaults } from './types.js'

import { parseDynamicResize } from './parseDynamicResize.js'

// Must match generateFileData.ts's allow-list — the only MIME types Sharp auto-detects multi-frame animation for.
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

    const isAnimated = ANIMATED_MIME_TYPES.includes(mimeType)
    const sharpOptions: SharpOptions = isAnimated ? { animated: true } : {}

    const withoutEnlargement = parseResult.withoutEnlargement ?? dynamicDefaults.withoutEnlargement

    // The output size is only known once the source is probed: with a single dimension
    // Sharp derives the other from the aspect ratio, `fit: 'outside'` can overflow the
    // requested box along one axis, and an animated source is resized frame by frame,
    // so its real cost is the per-frame output times the frame count.
    if (
      isAnimated ||
      parseResult.width === undefined ||
      parseResult.height === undefined ||
      dynamicDefaults.fit === 'outside'
    ) {
      const metadata = await sharpDependency(sourceBuffer, sharpOptions).metadata()
      const frameCount = isAnimated ? (metadata.pages ?? 1) : 1
      const output = getOutputDimensions({
        fit: dynamicDefaults.fit,
        height: parseResult.height,
        sourceHeight: metadata.pageHeight ?? metadata.height,
        sourceWidth: metadata.width,
        width: parseResult.width,
        withoutEnlargement,
      })

      if (
        output &&
        (output.width > dynamicDefaults.maxWidth ||
          output.height > dynamicDefaults.maxHeight ||
          output.width * output.height * frameCount > dynamicDefaults.maxPixels)
      ) {
        const frameDescription = frameCount > 1 ? ` across ${frameCount} frames` : ''

        return {
          response: Response.json(
            {
              errors: [
                {
                  message: `Requested dimensions (${output.width}x${output.height}${frameDescription}) exceed the configured maximum.`,
                },
              ],
            },
            { status: 400 },
          ),
          status: 'complete',
        }
      }
    }

    const resizedBuffer = await sharpDependency(sourceBuffer, sharpOptions)
      .resize({
        fit: dynamicDefaults.fit,
        height: parseResult.height,
        position: dynamicDefaults.position,
        width: parseResult.width,
        withoutEnlargement,
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

/**
 * The per-frame output size. When both dimensions are requested with any `fit` other
 * than `'outside'` this is the requested box, an upper bound (`fit: 'contain'`/`'inside'`
 * or `withoutEnlargement` can render smaller), which is what a resource budget needs.
 * `'outside'` scales to cover the box, so one axis can exceed it.
 */
function getOutputDimensions({
  fit,
  height,
  sourceHeight,
  sourceWidth,
  width,
  withoutEnlargement,
}: {
  fit: SharpDynamicDefaults['fit']
  height: number | undefined
  sourceHeight: number | undefined
  sourceWidth: number | undefined
  width: number | undefined
  withoutEnlargement: boolean
}): { height: number; width: number } | undefined {
  const hasBothDimensions = width !== undefined && height !== undefined

  if (hasBothDimensions && fit !== 'outside') {
    return { height, width }
  }

  if (!sourceWidth || !sourceHeight) {
    return undefined
  }

  const scale = hasBothDimensions
    ? Math.max(width / sourceWidth, height / sourceHeight)
    : width !== undefined
      ? width / sourceWidth
      : height! / sourceHeight
  const effectiveScale = withoutEnlargement ? Math.min(scale, 1) : scale

  return {
    height: Math.round(sourceHeight * effectiveScale),
    width: Math.round(sourceWidth * effectiveScale),
  }
}
