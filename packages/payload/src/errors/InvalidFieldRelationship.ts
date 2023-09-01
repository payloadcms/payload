import type { RelationshipField, UploadField } from '../fields/config/types'

import APIError from './APIError'

class InvalidFieldRelationship extends APIError {
  constructor(field: RelationshipField | UploadField, relationship: string) {
    super(`Field ${field.label} has invalid relationship '${relationship}'.`)
  }
}

export default InvalidFieldRelationship
