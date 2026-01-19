import type { FieldAffectingData } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class ReservedFieldName extends APIError {
  constructor(fieldPath: string, fieldName: string) {
    super(`Field ${fieldPath} has reserved name '${fieldName}'.`)
  }
}
