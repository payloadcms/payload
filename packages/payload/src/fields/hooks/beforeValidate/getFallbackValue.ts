import type { JsonObject, JsonValue, PayloadRequest } from '../../../types/index.js'
import type { FieldAffectingData } from '../../config/types.js'

import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js'
import { getDefaultValue } from '../../getDefaultValue.js'

export async function getFallbackValue({
  field,
  isDocumentValueAllowed = true,
  req,
  siblingDoc,
}: {
  field: FieldAffectingData
  isDocumentValueAllowed?: boolean
  req: PayloadRequest
  siblingDoc: JsonObject
}): Promise<JsonValue> {
  let fallbackValue: JsonValue = undefined
  if ('name' in field && field.name) {
    if (isDocumentValueAllowed && typeof siblingDoc[field.name] !== 'undefined') {
      fallbackValue = deepCopyObjectSimple(siblingDoc[field.name])
    } else if ('defaultValue' in field && typeof field.defaultValue !== 'undefined') {
      fallbackValue = await getDefaultValue({
        defaultValue: field.defaultValue,
        locale: req.locale || '',
        req,
        user: req.user,
      })
    }
  }

  return fallbackValue
}
