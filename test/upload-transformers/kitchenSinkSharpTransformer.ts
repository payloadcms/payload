import type { CanTransformArgs, HandleTransformRequestArgs, UploadTransformer } from 'payload'

import sharp from 'sharp'

/**
 * Dynamic (request-time) query parameters this transformer recognizes. Presence
 * of any one of these routes the request into this transformer; unrecognized
 * keys are ignored so an ordinary file read still falls through untouched.
 */
export type KitchenSinkQuery = {
  blur?: number
  brightness?: number
  flip?: boolean
  flop?: boolean
  gamma?: number
  grayscale?: boolean
  hue?: number
  median?: number
  negate?: boolean
  normalize?: boolean
  rotate?: number
  saturation?: number
  sharpen?: boolean
  threshold?: number
  tint?: string
}

const KITCHEN_SINK_QUERY_KEYS = [
  'blur',
  'brightness',
  'flip',
  'flop',
  'gamma',
  'grayscale',
  'hue',
  'median',
  'negate',
  'normalize',
  'rotate',
  'saturation',
  'sharpen',
  'threshold',
  'tint',
] as const satisfies readonly (keyof KitchenSinkQuery)[]

const NUMERIC_QUERY_KEYS = [
  'blur',
  'brightness',
  'gamma',
  'hue',
  'median',
  'rotate',
  'saturation',
  'threshold',
] as const satisfies readonly (keyof KitchenSinkQuery)[]

const BOOLEAN_QUERY_KEYS = [
  'flip',
  'flop',
  'grayscale',
  'negate',
  'normalize',
  'sharpen',
] as const satisfies readonly (keyof KitchenSinkQuery)[]

/**
 * Parses `searchParams` into a `KitchenSinkQuery`. `isRouted` is true whenever
 * any recognized key is present at all, even if its value can't be parsed -
 * matching the "recognized but possibly invalid" routing shape used by the
 * official Sharp transformer's own dynamic-resize parsing.
 */
export function parseKitchenSinkQuery({ searchParams }: { searchParams: URLSearchParams }): {
  isRouted: boolean
  query: KitchenSinkQuery
} {
  const isRouted = KITCHEN_SINK_QUERY_KEYS.some((key) => searchParams.has(key))

  if (!isRouted) {
    return { isRouted: false, query: {} }
  }

  const query: KitchenSinkQuery = {}

  for (const key of BOOLEAN_QUERY_KEYS) {
    if (searchParams.has(key)) {
      query[key] = true
    }
  }

  for (const key of NUMERIC_QUERY_KEYS) {
    const rawValue = searchParams.get(key)
    if (rawValue === null) {
      continue
    }
    const parsedValue = Number(rawValue)
    if (!Number.isNaN(parsedValue)) {
      query[key] = parsedValue
    }
  }

  const tint = searchParams.get('tint')
  if (tint !== null) {
    query.tint = tint
  }

  return { isRouted: true, query }
}

export function hexToRgb(hex: string): { b: number; g: number; r: number } | undefined {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) {
    return undefined
  }
  const value = match[1]!
  return {
    b: parseInt(value.slice(4, 6), 16),
    g: parseInt(value.slice(2, 4), 16),
    r: parseInt(value.slice(0, 2), 16),
  }
}

/**
 * Applies every recognized operation in a fixed order, skipping any that
 * weren't requested. Order matters: geometry first, then color, then the
 * filters/effects that are cheapest to reason about when layered.
 */
function applyKitchenSinkPipeline(source: sharp.Sharp, query: KitchenSinkQuery): sharp.Sharp {
  let pipeline = source

  if (query.rotate !== undefined) {
    pipeline = pipeline.rotate(query.rotate)
  }
  if (query.flip) {
    pipeline = pipeline.flip()
  }
  if (query.flop) {
    pipeline = pipeline.flop()
  }
  if (query.grayscale) {
    pipeline = pipeline.grayscale()
  }
  if (query.tint !== undefined) {
    const rgb = hexToRgb(query.tint)
    if (rgb) {
      pipeline = pipeline.tint(rgb)
    }
  }
  if (query.brightness !== undefined || query.saturation !== undefined || query.hue !== undefined) {
    // sharp's modulate() rejects keys present with an `undefined` value, so only
    // the requested adjustments are included rather than passing all three.
    const modulateOptions: Parameters<sharp.Sharp['modulate']>[0] = {}
    if (query.brightness !== undefined) {
      modulateOptions.brightness = query.brightness
    }
    if (query.saturation !== undefined) {
      modulateOptions.saturation = query.saturation
    }
    if (query.hue !== undefined) {
      modulateOptions.hue = query.hue
    }
    pipeline = pipeline.modulate(modulateOptions)
  }
  if (query.negate) {
    pipeline = pipeline.negate()
  }
  if (query.gamma !== undefined) {
    pipeline = pipeline.gamma(query.gamma)
  }
  if (query.normalize) {
    pipeline = pipeline.normalize()
  }
  if (query.median !== undefined) {
    pipeline = pipeline.median(query.median)
  }
  if (query.blur !== undefined) {
    pipeline = pipeline.blur(query.blur)
  }
  if (query.sharpen) {
    pipeline = pipeline.sharpen()
  }
  if (query.threshold !== undefined) {
    pipeline = pipeline.threshold(query.threshold)
  }

  return pipeline
}

function canTransform(args: CanTransformArgs): boolean {
  if (args.operation !== 'request') {
    return false
  }

  return parseKitchenSinkQuery({ searchParams: args.req.searchParams ?? new URLSearchParams() })
    .isRouted
}

async function handleRequest({
  getSourceFile,
  mimeType,
  req,
}: HandleTransformRequestArgs): Promise<{
  response?: Response
  status: 'complete' | 'continue'
}> {
  const { isRouted, query } = parseKitchenSinkQuery({
    searchParams: req.searchParams ?? new URLSearchParams(),
  })

  if (!isRouted) {
    return { status: 'continue' }
  }

  const source = await getSourceFile()

  if (!source.ok) {
    return { response: source, status: 'complete' }
  }

  const sourceBuffer = Buffer.from(await source.arrayBuffer())
  const outputBuffer = await applyKitchenSinkPipeline(sharp(sourceBuffer), query).toBuffer()

  const headers = new Headers()
  headers.set('Content-Type', mimeType)
  headers.set('Content-Length', String(outputBuffer.length))

  return {
    response: new Response(req.method === 'HEAD' ? null : outputBuffer, {
      headers,
      status: 200,
    }),
    status: 'continue',
  }
}

/**
 * A test-only "kitchen sink" image transformer: rather than one Sharp
 * capability like the official `sharpTransformer`'s resize, it exercises a wide
 * spread of the Sharp API (geometry, color, and filter operations) through a
 * single dynamic-request transformer, proving `upload.transformers` can host
 * more than one Sharp-backed transformer side by side without conflict.
 */
export const kitchenSinkSharpTransformer: UploadTransformer = {
  slug: 'kitchen-sink-sharp',
  canTransform,
  handleRequest,
  mimeTypes: ['image/*'],
}
