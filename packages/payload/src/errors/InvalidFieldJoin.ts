import type { JoinField } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class InvalidFieldJoin extends APIError {
  constructor(field: JoinField, fieldPath: string) {
    super(
      `Invalid join field with path ${fieldPath}. The config does not have a field '${field.on}' in collection '${field.collection}'.`,
    )
  }
}
