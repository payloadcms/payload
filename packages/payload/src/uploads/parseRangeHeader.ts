import parseRange from 'range-parser'

export type ByteRange = {
  end: number
  start: number
}

export type ParseRangeResult =
  | { range: ByteRange; type: 'partial' }
  | { range: null; type: 'full' }
  | { range: null; type: 'invalid' }

/**
 * Parses HTTP Range header according to RFC 7233
 *
 * @returns Result object indicating whether to serve full file, partial content, or invalid range
 */
export function parseRangeHeader({
  fileSize,
  rangeHeader,
}: {
  fileSize: number
  rangeHeader: null | string
}): ParseRangeResult {
  // No Range header - serve full file
  if (!rangeHeader) {
    return { type: 'full', range: null }
  }

  const result = parseRange(fileSize, rangeHeader)

  // Invalid range syntax or unsatisfiable range
  if (result === -1 || result === -2) {
    return { type: 'invalid', range: null }
  }

  // Must be bytes range type
  if (result.type !== 'bytes' || result.length === 0) {
    return { type: 'invalid', range: null }
  }

  // Multi-range requests: use first range only (standard simplification)
  const range = result[0]

  if (!range) {
    return { type: 'invalid', range: null }
  }

  return {
    type: 'partial',
    range: {
      end: range.end,
      start: range.start,
    },
  }
}
