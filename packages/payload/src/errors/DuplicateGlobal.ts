import type { GlobalConfig } from '../globals/config/types.js'

import { APIError } from './APIError.js'

export class DuplicateGlobal extends APIError {
  constructor(config: GlobalConfig) {
    super(
      `Global label "${typeof config.label === 'string' ? config.label : config.slug}" is already in use`,
    )
    this.name = 'DuplicateGlobal'
  }
}
