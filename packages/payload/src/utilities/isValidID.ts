import ObjectID from 'bson-objectid'

export const isValidID = (
  value: number | string,
  type: 'ObjectID' | 'number' | 'text',
): boolean => {
  if (type === 'text') return typeof value === 'string'
  if (typeof value === 'number' && !Number.isNaN(value)) return true

  if (type === 'ObjectID') {
    return ObjectID.isValid(String(value))
  }
}
