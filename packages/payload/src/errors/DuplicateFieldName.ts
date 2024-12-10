import { APIError } from './APIError.js'

export class DuplicateFieldName extends APIError {
  constructor(fieldName: string) {
    super(
      `A field with the name '${fieldName}' was found multiple times on the same level. Field names must be unique.`,
    )
  }
}
