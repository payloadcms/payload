import { isValidObjectIdHex } from './objectIdHex.js'

export const isValidID = (value: unknown, type: 'number' | 'ObjectID' | 'text'): boolean => {
  if (type === 'text' && value) {
    return typeof value === 'string' || isValidObjectIdHex(value)
  }

  if (type === 'number' && typeof value === 'number' && !Number.isNaN(value)) {
    return true
  }

  if (type === 'ObjectID') {
    return isValidObjectIdHex(value)
  }

  return false
}
