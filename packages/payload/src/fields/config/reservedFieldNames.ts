import type { Field } from '../../fields/config/types.js'

import { ReservedFieldName } from '../../errors/ReservedFieldName.js'
import { fieldAffectsData } from '../../fields/config/types.js'

/**
 * Reserved field names for array fields
 */
const reservedArrayFieldNames = ['id']

/**
 * Reserved field names for block fields
 */
const reservedBlockFieldNames = ['blockName', 'blockType', 'id']

/**
 * Sanitize fields for Array fields
 */
export const sanitizeArrayFields = (fields: Field[]) => {
  for (const field of fields) {
    if (fieldAffectsData(field) && field.name) {
      if (reservedArrayFieldNames.includes(field.name)) {
        throw new ReservedFieldName(field, field.name)
      }
    }
  }
}

/**
 * Sanitize fields for Block fields
 */
export const sanitizeBlockFields = (fields: Field[]) => {
  for (const field of fields) {
    if (fieldAffectsData(field) && field.name) {
      if (reservedBlockFieldNames.includes(field.name)) {
        throw new ReservedFieldName(field, field.name)
      }
    }
  }
}
