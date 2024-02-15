import { ObjectId } from 'bson'

export const isValidID = (
  value: number | string,
  type: 'ObjectID' | 'number' | 'text',
): boolean => {
  if (type === 'text') return value && typeof value === 'string'
  if (typeof value === 'number' && !Number.isNaN(value)) return true

  if (type === 'ObjectID') {
    return ObjectId.isValid(String(value))
  }
}
