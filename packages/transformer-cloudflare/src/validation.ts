import type {
  CloudflareFormatOptions,
  CloudflareOutputOptions,
  CloudflareTransformation,
} from './types.js'

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
export const FORMATS = ['avif', 'gif', 'jpeg', 'png', 'webp'] as const
const FITS = ['contain', 'cover', 'crop', 'scale-down']
const GRAVITIES = ['auto', 'bottom', 'center', 'entropy', 'face', 'left', 'right', 'top']
const TRANSFORM_KEYS = [
  'background',
  'blur',
  'brightness',
  'contrast',
  'fit',
  'flip',
  'gamma',
  'gravity',
  'height',
  'rotate',
  'saturation',
  'sharpen',
  'trim',
  'width',
]

export function validateTransformation(args: { value: unknown }): CloudflareTransformation {
  const value = parseRecord(args)

  if (Object.keys(value).some((key) => !TRANSFORM_KEYS.includes(key))) {
    throw new Error('Unsupported Cloudflare transformation option.')
  }
  for (const key of ['width', 'height']) {
    if (value[key] !== undefined) {
      assertPositiveInteger({ name: key, value: value[key] })
    }
  }
  for (const [key, max] of [
    ['blur', 250],
    ['brightness', Infinity],
    ['contrast', Infinity],
    ['gamma', Infinity],
    ['saturation', Infinity],
    ['sharpen', 10],
  ] as const) {
    const numeric = value[key]

    if (
      numeric !== undefined &&
      (typeof numeric !== 'number' || !Number.isFinite(numeric) || numeric < 0 || numeric > max)
    ) {
      throw new Error(`Invalid Cloudflare ${key}.`)
    }
  }
  if (
    value.background !== undefined &&
    (typeof value.background !== 'string' || value.background.length > 256)
  ) {
    throw new Error('Invalid Cloudflare background.')
  }
  if (value.fit !== undefined && (typeof value.fit !== 'string' || !FITS.includes(value.fit))) {
    throw new Error('Invalid Cloudflare fit.')
  }
  if (
    value.flip !== undefined &&
    (typeof value.flip !== 'string' || !['h', 'hv', 'v'].includes(value.flip))
  ) {
    throw new Error('Invalid Cloudflare flip.')
  }
  if (value.rotate !== undefined && ![0, 90, 180, 270].includes(value.rotate as number)) {
    throw new Error('Invalid Cloudflare rotation.')
  }
  if (value.gravity !== undefined) {
    if (typeof value.gravity === 'string') {
      if (!GRAVITIES.includes(value.gravity)) {
        throw new Error('Invalid Cloudflare gravity.')
      }
    } else {
      const gravity = parseRecord({ value: value.gravity })

      if (
        typeof gravity.mode !== 'string' ||
        !['box-center', 'remainder'].includes(gravity.mode) ||
        Object.keys(gravity).some((key) => !['mode', 'x', 'y'].includes(key))
      ) {
        throw new Error('Invalid Cloudflare gravity.')
      }
      for (const key of ['x', 'y']) {
        const coordinate = gravity[key]

        if (
          coordinate !== undefined &&
          (typeof coordinate !== 'number' ||
            !Number.isFinite(coordinate) ||
            coordinate < 0 ||
            coordinate > 1)
        ) {
          throw new Error('Cloudflare gravity coordinates must be between 0 and 1.')
        }
      }
    }
  }
  if (value.trim !== undefined) {
    const trim = parseRecord({ value: value.trim })

    if (
      Object.keys(trim).some(
        (key) => !['bottom', 'height', 'left', 'right', 'top', 'width'].includes(key),
      )
    ) {
      throw new Error('Invalid Cloudflare trim.')
    }
    for (const [key, number] of Object.entries(trim)) {
      if (
        typeof number !== 'number' ||
        !Number.isSafeInteger(number) ||
        number < (key === 'width' || key === 'height' ? 1 : 0)
      ) {
        throw new Error('Invalid Cloudflare trim dimensions.')
      }
    }
  }
  return value as CloudflareTransformation
}

export function validateOutput(args: { value: unknown }): CloudflareOutputOptions {
  const value = parseRecord(args)

  if (
    Object.keys(value).some((key) => !['anim', 'format', 'quality'].includes(key)) ||
    !FORMATS.some((format) => value.format === `image/${format}`)
  ) {
    throw new Error('Invalid Cloudflare output format.')
  }
  if (value.anim !== undefined && typeof value.anim !== 'boolean') {
    throw new Error('Invalid Cloudflare animation option.')
  }
  if (
    value.quality !== undefined &&
    (typeof value.quality !== 'number' ||
      !Number.isInteger(value.quality) ||
      value.quality < 1 ||
      value.quality > 100)
  ) {
    throw new Error('Cloudflare quality must be an integer between 1 and 100.')
  }
  return value as CloudflareOutputOptions
}

export function validateFormatOptions({
  value,
}: {
  value: CloudflareFormatOptions | undefined
}): void {
  if (value) {
    validateOutput({ value: { ...value, format: `image/${value.format}` } })
  }
}

export function assertPositiveInteger({ name, value }: { name: string; value: unknown }): void {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`)
  }
}

export function parseRecord({ value }: { value: unknown }): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a Cloudflare options object.')
  }
  return value as Record<string, unknown>
}

/** Bounds consumption even if the sender omits or lies about Content-Length. */
export async function readBody({
  body,
  maxBytes = MAX_IMAGE_BYTES,
}: {
  body: null | ReadableStream<Uint8Array>
  maxBytes?: number
}): Promise<Uint8Array<ArrayBuffer>> {
  if (!body) {
    throw new Error('Cloudflare Images returned an empty body.')
  }
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }
      length += value.byteLength
      if (length > maxBytes) {
        await reader.cancel()
        throw new Error('Cloudflare Images payload exceeds the byte limit.')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(length)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }

  return bytes
}
