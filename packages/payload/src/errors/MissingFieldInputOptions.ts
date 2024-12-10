import type { RadioField, SelectField } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class MissingFieldInputOptions extends APIError {
  constructor(field: RadioField | SelectField) {
    super(`Field ${field.label} is missing options.`)
  }
}
