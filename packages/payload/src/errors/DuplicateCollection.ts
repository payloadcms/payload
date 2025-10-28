import { APIError } from './APIError.js'

export class DuplicateCollection extends APIError {
  constructor(propertyName: string, duplicate: string) {
    super(`Collection ${propertyName} already in use: "${duplicate}"`)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'DuplicateCollection'
    Object.defineProperty(this.constructor, 'name', { value: 'DuplicateCollection' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, DuplicateCollection.prototype)
  }
}
