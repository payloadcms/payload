type BinaryUUID = {
  buffer: Buffer
  sub_type: number
  toString: (encoding?: string) => string
  toUUID?: () => { toString: () => string }
}

/**
 * Detects a BSON Binary value holding a UUID (subtype 4), as returned by MongoDB
 * for fields defined with `mongoose.Schema.Types.UUID` when reading lean/aggregated
 * documents.
 */
export const isUUID = (value: unknown): value is BinaryUUID => {
  return (
    !!value &&
    typeof value === 'object' &&
    '_bsontype' in value &&
    (value as { _bsontype: unknown })._bsontype === 'Binary' &&
    'sub_type' in value &&
    (value as { sub_type: unknown }).sub_type === 4
  )
}

/**
 * Converts a BSON Binary UUID to its canonical hyphenated string representation.
 */
export const uuidToString = (value: BinaryUUID): string => {
  if (typeof value.toUUID === 'function') {
    return value.toUUID().toString()
  }

  const hex = value.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
