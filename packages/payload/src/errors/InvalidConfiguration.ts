import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class InvalidConfiguration extends APIError {
  constructor(message: string) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'InvalidConfiguration'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, InvalidConfiguration.prototype)
  }
}
