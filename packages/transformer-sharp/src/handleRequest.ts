import type { HandleTransformRequestArgs, HandleTransformRequestResult } from 'payload'
import type { SharpOptions } from 'sharp'

import { createFileSource } from 'payload/internal'

import type {
  SharpCollectionConfig,
  SharpDependency,
  SharpDynamicDefaults,
  SharpTransformLimits,
} from './types.js'

import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'
import { parseDynamicResize } from './parseDynamicResize.js'
import { resolveFocalPoint } from './resolveFocalPoint.js'
import { getOutputDimensions } from './resolveResizeDimensions.js'
import { resolveOutputFormat, resolveWithMetadata, transformState } from './transformState.js'

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
  collections = {},
  dynamicDefaults,
  maxSourceBytes = 64 * 1024 * 1024,
  sharpDependency,
  transformLimits,
}: {
  collections?: Partial<Record<string, SharpCollectionConfig>>
  dynamicDefaults: Required<SharpDynamicDefaults>
  maxSourceBytes?: number
  sharpDependency: SharpDependency
  transformLimits?: SharpTransformLimits
}): (args: HandleTransformRequestArgs) => Promise<HandleTransformRequestResult> {
  return async ({ collectionSlug: argumentsCollectionSlug, doc, getSourceFile, purpose, req }) => {
    const collectionConfig = collections[argumentsCollectionSlug]
    const withMetadata = resolveWithMetadata({
      state: doc._transforms,
      withMetadata: collectionConfig?.withMetadata,
    })
    if (purpose === 'persisted-default') {
      const source = await getSourceFile()
      const variantKey = Object.keys(doc.variants ?? {}).find(
        (key) => doc.variants[key]?.filename === req.routeParams?.filename,
      )
      const variant =
        variantKey &&
        (
          collectionConfig?.variants ??
          req.payload?.collections?.[argumentsCollectionSlug]?.config.upload.variants
        )?.find(({ name }) => name === variantKey)

      const shouldTransformVariant = Boolean(
        variant && (variant.width || variant.height || variant.formatOptions),
      )
      let file = await transformState({
        buffer: Buffer.from(
          await createFileSource({
            filename: doc.original?.filename ?? doc.filename,
            mimeType: doc.original?.mimeType ?? doc.mimeType,
            retrieve: () => Promise.resolve(source),
          }).arrayBuffer({ maxBytes: maxSourceBytes }),
        ),
        filename: doc.original?.filename ?? doc.filename,
        formatOptions: shouldTransformVariant ? undefined : collectionConfig?.formatOptions,
        limits: transformLimits,
        metadataOptions: shouldTransformVariant ? undefined : { req, withMetadata },
        mimeType:
          source.headers.get('Content-Type')?.split(';')[0]?.trim() ??
          doc.original?.mimeType ??
          doc.mimeType,
        sharpDependency,
        state: shouldTransformVariant
          ? {
              ...doc._transforms,
              encoding: undefined,
              metadataPolicy: {
                mode:
                  withMetadata === true || typeof withMetadata === 'function'
                    ? 'preserve'
                    : 'strip',
              },
            }
          : doc._transforms,
      })
      if (variant && shouldTransformVariant) {
        const original = doc.original ?? doc
        const focalPoint =
          original.width && original.height
            ? resolveFocalPoint({
                height: original.height,
                state: doc._transforms,
                width: original.width,
              })
            : undefined

        file = await transformState({
          buffer: Buffer.from(await file.arrayBuffer()),
          filename: file.name,
          formatOptions: variant.formatOptions ?? collectionConfig?.formatOptions,
          limits: transformLimits,
          metadataOptions: { req, withMetadata },
          mimeType: file.type,
          sharpDependency,
          state: {
            encoding: doc._transforms.encoding,
            focalPoint,
            metadataPolicy: doc._transforms.metadataPolicy,
            resize:
              variant.width || variant.height
                ? {
                    ...(variant.width
                      ? { height: variant.height, width: variant.width }
                      : { height: variant.height! }),
                    fit: variant.fit,
                    withoutEnlargement: variant.withoutEnlargement,
                  }
                : undefined,
          },
        })
      }
      const buffer = Buffer.from(await file.arrayBuffer())

      return {
        response: new Response(buffer, {
          headers: { 'Content-Length': String(buffer.length), 'Content-Type': file.type },
        }),
        status: 'continue',
      }
    }
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

    const mimeType = source.headers.get('Content-Type')?.split(';')[0]?.trim() ?? ''
    const sourceBuffer = Buffer.from(
      await createFileSource({
        filename: doc.filename,
        mimeType,
        retrieve: () => Promise.resolve(source),
      }).arrayBuffer({ maxBytes: maxSourceBytes }),
    )

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
      const frameHeight = metadata.pageHeight ?? metadata.height
      // EXIF orientations 5-8 rotate the image by 90°, so `.rotate()` below swaps its axes.
      const isRotatedQuarterTurn = [5, 6, 7, 8].includes(metadata.orientation!)
      const output = getOutputDimensions({
        fit: dynamicDefaults.fit,
        height: parseResult.height,
        sourceHeight: isRotatedQuarterTurn ? metadata.width : frameHeight,
        sourceWidth: isRotatedQuarterTurn ? frameHeight : metadata.width,
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

    let resizedBuffer: Buffer

    const original = doc.original ?? doc
    const focalPoint =
      doc._transforms && original.width && original.height
        ? resolveFocalPoint({
            height: original.height,
            state: doc._transforms,
            width: original.width,
          })
        : undefined

    if (focalPoint && dynamicDefaults.fit === 'cover' && parseResult.width && parseResult.height) {
      const file = await transformState({
        buffer: sourceBuffer,
        filename: doc.filename,
        limits: dynamicDefaults,
        metadataOptions: { req, withMetadata },
        mimeType,
        sharpDependency,
        state: {
          encoding: doc._transforms?.encoding,
          focalPoint,
          metadataPolicy: doc._transforms?.metadataPolicy,
          resize: {
            fit: 'cover',
            height: parseResult.height,
            width: parseResult.width,
            withoutEnlargement,
          },
        },
      })

      resizedBuffer = Buffer.from(await file.arrayBuffer())
    } else {
      // Normalize EXIF orientation before producing the query-sized output.
      let image = sharpDependency(sourceBuffer, sharpOptions).rotate().resize({
        fit: dynamicDefaults.fit,
        height: parseResult.height,
        position: dynamicDefaults.position,
        width: parseResult.width,
        withoutEnlargement,
      })
      const outputFormat = resolveOutputFormat({ encoding: doc._transforms?.encoding, mimeType })
      if (outputFormat) {
        image = image.toFormat(outputFormat.format, outputFormat.options)
      }
      image = await optionallyAppendMetadata({ req, sharpFile: image, withMetadata })
      resizedBuffer = await image.toBuffer()
    }
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
