import type { DynamicResizeParseResult } from './types.js'

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/

function parsePositiveInteger(value: string): number | undefined {
  if (!POSITIVE_INTEGER_PATTERN.test(value)) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isSafeInteger(parsed) ? parsed : undefined
}

/**
 * Strictly parses the v1 dynamic resize query parameters (`width`, `height`,
 * `withoutEnlargement`). The presence of any of them routes the request —
 * a malformed combination is `valid: false` (mapped to `400`), not treated as
 * an ordinary read. Every other query key (`draft`, `depth`, `where`, `prefix`,
 * …) is ignored.
 */
export function parseDynamicResize({
  limits,
  searchParams,
}: {
  limits: { maxHeight: number; maxPixels: number; maxWidth: number }
  searchParams: URLSearchParams
}): DynamicResizeParseResult {
  const widthValues = searchParams.getAll('width')
  const heightValues = searchParams.getAll('height')
  const withoutEnlargementValues = searchParams.getAll('withoutEnlargement')

  const isRouted =
    widthValues.length > 0 || heightValues.length > 0 || withoutEnlargementValues.length > 0

  if (!isRouted) {
    return { isRouted: false }
  }

  if (widthValues.length > 1) {
    return { error: '`width` may only be specified once.', isRouted: true, valid: false }
  }

  if (heightValues.length > 1) {
    return { error: '`height` may only be specified once.', isRouted: true, valid: false }
  }

  if (withoutEnlargementValues.length > 1) {
    return {
      error: '`withoutEnlargement` may only be specified once.',
      isRouted: true,
      valid: false,
    }
  }

  if (widthValues.length === 0 && heightValues.length === 0) {
    return {
      error: 'At least one of `width` or `height` is required to resize.',
      isRouted: true,
      valid: false,
    }
  }

  let width: number | undefined

  if (widthValues.length === 1) {
    width = parsePositiveInteger(widthValues[0]!)

    if (width === undefined) {
      return { error: '`width` must be a positive integer.', isRouted: true, valid: false }
    }

    if (width > limits.maxWidth) {
      return {
        error: `\`width\` exceeds the configured maximum of ${limits.maxWidth}.`,
        isRouted: true,
        valid: false,
      }
    }
  }

  let height: number | undefined

  if (heightValues.length === 1) {
    height = parsePositiveInteger(heightValues[0]!)

    if (height === undefined) {
      return { error: '`height` must be a positive integer.', isRouted: true, valid: false }
    }

    if (height > limits.maxHeight) {
      return {
        error: `\`height\` exceeds the configured maximum of ${limits.maxHeight}.`,
        isRouted: true,
        valid: false,
      }
    }
  }

  if (width !== undefined && height !== undefined && width * height > limits.maxPixels) {
    return {
      error: `Requested dimensions exceed the configured maximum of ${limits.maxPixels} pixels.`,
      isRouted: true,
      valid: false,
    }
  }

  let withoutEnlargement: boolean | undefined

  if (withoutEnlargementValues.length === 1) {
    const raw = withoutEnlargementValues[0]

    if (raw !== 'true' && raw !== 'false') {
      return {
        error: '`withoutEnlargement` must be "true" or "false".',
        isRouted: true,
        valid: false,
      }
    }

    withoutEnlargement = raw === 'true'
  }

  return { height, isRouted: true, valid: true, width, withoutEnlargement }
}
