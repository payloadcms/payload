import type { Field } from '../fields/config/types'

import { fieldAffectsData } from '../fields/config/types'
import APIError from './APIError'

class MissingFieldType extends APIError {
  constructor(field: Field) {
    super(
      `Field${
        fieldAffectsData(field) ? ` "${field.name}"` : ''
      } is either missing a field type or it does not match an available field type`,
    )
  }
}

export default MissingFieldType
