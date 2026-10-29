import type {
  CloudflareFormatOptions,
  CloudflareOutputOptions,
  CloudflareTransformation,
} from './types.js'

import { FORMATS } from './validation.js'

export function resolveOutput({
  formatOptions,
  mimeType,
}: {
  formatOptions?: CloudflareFormatOptions
  mimeType: string
}): CloudflareOutputOptions {
  const format = formatOptions?.format ?? FORMATS.find((format) => mimeType === `image/${format}`)

  if (!format) {
    throw new Error(`Unsupported Cloudflare image format: ${mimeType}.`)
  }

  return {
    anim: formatOptions?.anim ?? true,
    format: `image/${format}`,
    quality: formatOptions?.quality,
  }
}

export function resolveResize({
  options,
}: {
  options: { withoutEnlargement?: boolean } & CloudflareTransformation
}): CloudflareTransformation {
  const { withoutEnlargement, ...transform } = options
  const fit = options.fit ?? (options.width && options.height ? 'cover' : 'contain')

  return {
    ...transform,
    fit: withoutEnlargement ? (fit === 'cover' || fit === 'crop' ? 'crop' : 'scale-down') : fit,
  }
}
