import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class Locked extends APIError {
  constructor(message: string) {
    super(message, httpStatus.LOCKED)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'Locked'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, Locked.prototype)
  }
}
