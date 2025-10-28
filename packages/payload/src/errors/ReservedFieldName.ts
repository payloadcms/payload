import type { FieldAffectingData } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class ReservedFieldName extends APIError {
  constructor(field: FieldAffectingData, fieldName: string) {
    super(`Field ${field.label} has reserved name '${fieldName}'.`)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'ReservedFieldName'
    Object.defineProperty(this.constructor, 'name', { value: 'ReservedFieldName' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ReservedFieldName.prototype)
  }
}
