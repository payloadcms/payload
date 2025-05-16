// @ts-strict-ignore
import ObjectIdImport from 'bson-objectid'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export const isValidID = (
  value: number | string,
  type: 'number' | 'ObjectID' | 'text',
): boolean => {
  if (type === 'text' && value) {
    if (['object', 'string'].includes(typeof value)) {
      const isObjectID = ObjectId.isValid(value as string)
      return typeof value === 'string' || isObjectID
    }
    return false
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return true
  }

  if (type === 'ObjectID') {
    return ObjectId.isValid(String(value))
  }
}
