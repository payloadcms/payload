import type { GlobalConfig } from '../globals/config/types.js'

import { APIError } from './APIError.js'

export class DuplicateGlobal extends APIError {
  constructor(config: GlobalConfig) {
    super(`Global label "${config.label}" is already in use`)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'DuplicateGlobal'
    Object.defineProperty(this.constructor, 'name', { value: 'DuplicateGlobal' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, DuplicateGlobal.prototype)
  }
}
