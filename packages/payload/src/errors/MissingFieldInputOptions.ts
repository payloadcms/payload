import type { RadioField, SelectField } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class MissingFieldInputOptions extends APIError {
  constructor(field: RadioField | SelectField) {
    super(`Field ${typeof field.label === 'string' ? field.label : field.name} is missing options.`)
    this.name = 'MissingFieldInputOptions'
  }
}
