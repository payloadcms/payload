import ObjectIdImport from 'bson-objectid'

import type { FieldHook } from '../config/types.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default
/**
 * Arrays and Blocks need to clear ids beforeDuplicate
 */
export const baseBeforeDuplicateArrays: FieldHook = ({ value }) => {
  if (value) {
    value = value.map((item) => {
      item.id = new ObjectId().toHexString()
      return item
    })
    return value
  }
}
