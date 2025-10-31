import type { FieldAffectingData } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class InvalidFieldName extends APIError {
  constructor(field: FieldAffectingData, fieldName: string) {
    super(
      `Field ${field.label} has invalid name '${fieldName}'. Field names can not include periods (.) and must be alphanumeric.`,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'InvalidFieldName'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, InvalidFieldName.prototype)
  }
}
