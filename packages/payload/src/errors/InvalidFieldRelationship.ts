import { APIError } from './APIError.js'

export class InvalidFieldRelationship extends APIError {
  constructor(fieldPath: string, relationship: string) {
    super(`Field with path ${fieldPath} has invalid relationship '${relationship}'.`)
  }
}
