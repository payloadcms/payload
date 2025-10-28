import type { RelationshipField, UploadField } from '../fields/config/types.js'

import { APIError } from './APIError.js'

export class InvalidFieldRelationship extends APIError {
  constructor(field: RelationshipField | UploadField, relationship: string) {
    super(`Field ${field.label} has invalid relationship '${relationship}'.`)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'InvalidFieldRelationship'
    Object.defineProperty(this.constructor, 'name', { value: 'InvalidFieldRelationship' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, InvalidFieldRelationship.prototype)
  }
}
