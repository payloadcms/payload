import ObjectId from 'bson-objectid'

export const isValidID = (
  value: number | string,
  type: 'ObjectID' | 'number' | 'text',
): boolean => {
  if (type === 'text' && value) {
    if (['object', 'string'].includes(typeof value)) {
      const isObjectID = ObjectId.default.isValid(value as string)
      return typeof value === 'string' || isObjectID
    }
    return false
  }

  if (typeof value === 'number' && !Number.isNaN(value)) return true

  if (type === 'ObjectID') {
    return ObjectId.default.isValid(String(value))
  }
}
