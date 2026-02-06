import type { Types } from 'mongoose'

export const isObjectID = (value: unknown): value is Types.ObjectId => {
  if (
    value &&
    typeof value === 'object' &&
    '_bsontype' in value &&
    value._bsontype === 'ObjectId' &&
    'toHexString' in value &&
    typeof value.toHexString === 'function'
  ) {
    return true
  }

  return false
}
