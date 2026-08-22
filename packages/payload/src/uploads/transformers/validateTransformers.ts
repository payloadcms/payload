import type { UploadTransformer } from './types.js'

const MIME_TOKEN_PATTERN = /^[\w!#$&^.+-]+$/

const CAPABILITY_KEYS = ['init', 'canTransform', 'transformFile', 'handleRequest'] as const

function isValidMimeTypePattern(pattern: unknown): boolean {
  if (typeof pattern !== 'string' || pattern.length === 0) {
    return false
  }

  if (pattern === '*/*') {
    return true
  }

  const [type, subtype] = pattern.split('/')

  if (type === undefined || subtype === undefined || pattern.split('/').length !== 2) {
    return false
  }

  if (!MIME_TOKEN_PATTERN.test(type)) {
    return false
  }

  return subtype === '*' || MIME_TOKEN_PATTERN.test(subtype)
}

/**
 * Validates `upload.transformers` at startup: unique, non-empty slugs; at least one
 * well-formed MIME pattern per transformer; and every declared capability is a function.
 * Called once for the authored list and again after every transformer `init()` runs,
 * since `init()` may return a mutated transformers list.
 */
export function validateTransformers({
  transformers,
}: {
  transformers: UploadTransformer[]
}): void {
  const errors: string[] = []
  const slugCounts = new Map<string, number>()

  transformers.forEach((transformer, index) => {
    const label = `upload.transformers[${index}]`
    const slug = transformer?.slug

    if (typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push(`${label} must have a non-empty \`slug\`.`)
    } else {
      slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1)
    }

    const identifier = typeof slug === 'string' && slug.length > 0 ? `"${slug}"` : label

    if (!Array.isArray(transformer?.mimeTypes) || transformer.mimeTypes.length === 0) {
      errors.push(`Transformer ${identifier} must declare at least one MIME type in \`mimeTypes\`.`)
    } else {
      transformer.mimeTypes.forEach((mimeType) => {
        if (!isValidMimeTypePattern(mimeType)) {
          errors.push(
            `Transformer ${identifier} has an invalid MIME type pattern: "${String(mimeType)}". ` +
              `Use an exact value (e.g. "image/png"), a category wildcard (e.g. "image/*"), or "*/*".`,
          )
        }
      })
    }

    for (const capability of CAPABILITY_KEYS) {
      const value = transformer?.[capability]

      if (value !== undefined && typeof value !== 'function') {
        errors.push(`Transformer ${identifier}'s \`${capability}\` must be a function.`)
      }
    }
  })

  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      errors.push(
        `Duplicate upload transformer slug: "${slug}" is used ${count} times. Every transformer must have a unique \`slug\`.`,
      )
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid \`upload.transformers\` configuration:\n${errors.join('\n')}`)
  }
}
