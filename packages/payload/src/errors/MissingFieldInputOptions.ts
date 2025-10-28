import type { RadioField, SelectField } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class MissingFieldInputOptions extends APIError {
  constructor(field: RadioField | SelectField) {
    super(`Field ${field.label} is missing options.`)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'MissingFieldInputOptions'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, MissingFieldInputOptions.prototype)
  }
}
