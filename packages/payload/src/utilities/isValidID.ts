import ObjectIdImport from 'bson-objectid'

const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport

export const isValidID = (
  value: number | string,
  type: 'number' | 'ObjectID' | 'text',
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
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
