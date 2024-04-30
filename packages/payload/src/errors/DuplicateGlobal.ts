import type { GlobalConfig } from '../globals/config/types.js'

import { APIError } from './APIError.js'

export class DuplicateGlobal extends APIError {
  constructor(config: GlobalConfig) {
    super(`Global label "${config.label}" is already in use`)
  }
}
