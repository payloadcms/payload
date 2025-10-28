import type { Field } from '../fields/config/types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { APIError } from './APIError.js'

export class MissingFieldType extends APIError {
  constructor(field: Field) {
    super(
      `Field${
        fieldAffectsData(field) ? ` "${field.name}"` : ''
      } is either missing a field type or it does not match an available field type`,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'MissingFieldType'
    Object.defineProperty(this.constructor, 'name', { value: 'MissingFieldType' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, MissingFieldType.prototype)
  }
}
