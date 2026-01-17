import { APIError } from './APIError.js'

export class DuplicateFieldName extends APIError {
  constructor(fieldPath: string) {
    super(
      `A field with path '${fieldPath}' was found multiple times on the same level. Field names must be unique.`,
    )
  }
}
