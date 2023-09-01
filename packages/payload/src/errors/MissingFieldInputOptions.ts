import type { RadioField, SelectField } from '../fields/config/types'

import APIError from './APIError'

class MissingFieldInputOptions extends APIError {
  constructor(field: RadioField | SelectField) {
    super(`Field ${field.label} is missing options.`)
  }
}

export default MissingFieldInputOptions
