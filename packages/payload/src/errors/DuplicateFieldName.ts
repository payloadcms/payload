import { APIError } from './APIError.js'

export class DuplicateFieldName extends APIError {
  constructor(fieldName: string) {
    super(
      `A field with the name '${fieldName}' was found multiple times on the same level. Field names must be unique.`,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'DuplicateFieldName'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, DuplicateFieldName.prototype)
  }
}
