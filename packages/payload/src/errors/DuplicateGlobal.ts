import type { GlobalConfig } from '../globals/config/types'

import APIError from './APIError'

class DuplicateGlobal extends APIError {
  constructor(config: GlobalConfig) {
    super(`Global label "${config.label}" is already in use`)
  }
}

export default DuplicateGlobal
