import type { UploadTransformer } from 'payload'

import type { CloudflareDynamicOptions, ImagesClient } from './types.js'

import { parseDynamicTransform } from './parseDynamicTransform.js'
import { resolveOutput, resolveResize } from './transformation.js'
import { readBody } from './validation.js'

export function createHandleRequest({
  client,
  dynamic,
}: {
  client: ImagesClient
  dynamic: CloudflareDynamicOptions
}): NonNullable<UploadTransformer['handleRequest']> {
  return async ({ filename, getSourceFile, mimeType, req }) => {
    const parsed = parseDynamicTransform({
      limits: {
        maxHeight: dynamic.maxHeight!,
        maxPixels: dynamic.maxPixels!,
        maxWidth: dynamic.maxWidth!,
      },
      searchParams: req.searchParams ?? new URLSearchParams(),
    })

    if (!parsed.isRouted) {
      return { status: 'continue' }
    }
    if (!parsed.valid) {
      return invalidRequest({ message: parsed.error })
    }
    if (req.headers?.get('range')) {
      return { response: new Response(null, { status: 416 }), status: 'complete' }
    }
    const source = await getSourceFile()

    if (!source.ok) {
      return { response: source, status: 'complete' }
    }
    const file = new File([await readBody({ body: source.body })], filename, {
      type: source.headers.get('content-type')?.split(';')[0] ?? mimeType,
    })
    const dimensions = await client.info({ file, req })

    if (!('width' in dimensions)) {
      return invalidRequest({ message: 'Cloudflare transformations require a raster image.' })
    }
    const transform = resolveResize({
      options: {
        fit: dynamic.fit,
        gravity: dynamic.gravity,
        height: parsed.height,
        width: parsed.width,
        withoutEnlargement: parsed.withoutEnlargement ?? dynamic.withoutEnlargement,
      },
    })
    const hasBothDimensions = parsed.width !== undefined && parsed.height !== undefined
    const scale =
      parsed.width !== undefined
        ? parsed.width / dimensions.width
        : parsed.height! / dimensions.height
    const effectiveScale =
      transform.fit === 'crop' || transform.fit === 'scale-down' ? Math.min(1, scale) : scale
    const width = hasBothDimensions ? parsed.width! : Math.ceil(dimensions.width * effectiveScale)
    const height = hasBothDimensions
      ? parsed.height!
      : Math.ceil(dimensions.height * effectiveScale)

    if (
      width > dynamic.maxWidth! ||
      height > dynamic.maxHeight! ||
      width * height > dynamic.maxPixels!
    ) {
      return invalidRequest({ message: 'Requested dimensions exceed the configured maximum.' })
    }
    const response = await client.transform({
      file,
      output: resolveOutput({
        formatOptions: dynamic.format
          ? { anim: dynamic.anim, format: dynamic.format, quality: dynamic.quality }
          : {
              anim: dynamic.anim,
              format: file.type.slice(6) as NonNullable<CloudflareDynamicOptions['format']>,
              quality: dynamic.quality,
            },
        mimeType: file.type,
      }),
      req,
      transforms: [transform],
    })

    // Payload removes HEAD bodies after all stages have consumed their input.
    return { response, status: 'continue' }
  }
}

function invalidRequest({ message }: { message: string }): {
  response: Response
  status: 'complete'
} {
  return { response: Response.json({ errors: [{ message }] }, { status: 400 }), status: 'complete' }
}
