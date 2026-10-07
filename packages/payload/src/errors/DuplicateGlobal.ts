import type { GlobalConfig } from '../globals/config/types.js'

import { APIError } from './APIError.js'

export class DuplicateGlobal extends APIError {
  constructor(propertyName: string, duplicate: string)
  constructor(config: GlobalConfig)
  constructor(propertyNameOrConfig: GlobalConfig | string, duplicate?: string) {
    if (typeof propertyNameOrConfig === 'string') {
      super(`Global ${propertyNameOrConfig} already in use: "${duplicate}"`)
    } else {
      super(`Global label "${propertyNameOrConfig.label}" is already in use`)
    }
    this.name = 'DuplicateGlobal'
  }
}
