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
  }
}
