import type { FieldAffectingData } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class InvalidFieldName extends APIError {
  constructor(field: FieldAffectingData, fieldName: string) {
    super(
      `Field ${typeof field.label === 'string' ? field.label : fieldName} has invalid name '${fieldName}'. Field names can not include periods (.) and must be alphanumeric.`,
    )
    this.name = 'InvalidFieldName'
  }
}
