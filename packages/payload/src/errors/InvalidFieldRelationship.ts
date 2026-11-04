import type { RelationshipField, UploadField } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class InvalidFieldRelationship extends APIError {
  constructor(field: RelationshipField | UploadField, relationship: string) {
    super(
      `Field ${typeof field.label === 'string' ? field.label : field.name} has invalid relationship '${relationship}'.`,
    )
    this.name = 'InvalidFieldRelationship'
  }
}
