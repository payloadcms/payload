import { APIError } from './APIError.js'

export class MissingCollectionLabel extends APIError {
  constructor() {
    super('payload.config.collection object is missing label')

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'MissingCollectionLabel'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, MissingCollectionLabel.prototype)
  }
}
