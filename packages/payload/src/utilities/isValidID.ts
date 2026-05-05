import { isValidObjectIdHex } from './objectIdHex.js'

export const isValidID = (
  value: number | string,
  type: 'number' | 'ObjectID' | 'text',
): boolean => {
  if (type === 'text' && value) {
    if (['object', 'string'].includes(typeof value)) {
      const isObjectID = isValidObjectIdHex(value)
      return typeof value === 'string' || isObjectID
    }
    return false
  }

  if (type === 'number' && typeof value === 'number' && !Number.isNaN(value)) {
    return true
  }

  if (type === 'ObjectID') {
    return isValidObjectIdHex(String(value))
  }

  return false
}
