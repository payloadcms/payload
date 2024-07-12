import type { FieldAffectingData } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class ReservedFieldName extends APIError {
  constructor(field: FieldAffectingData, fieldName: string) {
    super(`Field ${field.label} has reserved name '${fieldName}'.`)
  }
}
