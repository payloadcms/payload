import type { JoinField } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class InvalidFieldJoin extends APIError {
  constructor(field: JoinField) {
    super(
      `Invalid join field ${field.name}. The config does not have a field '${field.on}' in collection '${field.collection}'.`,
    )
  }
}
