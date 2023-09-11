import type { Config as GeneratedTypes } from 'payload/generated-types'

import type { InitOptions } from './config/types'
import type { RequestContext } from './express/types'
import type { Payload as LocalPayload } from './payload'

import { initHTTP } from './initHTTP'
import { BasePayload } from './payload'

export { DatabaseAdapter } from './database/types'

export { getPayload } from './payload'

require('isomorphic-fetch')

export class Payload extends BasePayload<GeneratedTypes> {
  async init(options: InitOptions): Promise<LocalPayload> {
    const payload = await initHTTP(options)
    Object.assign(this, payload)

    if (!options.local) {
      if (typeof options.onInit === 'function') await options.onInit(this)
      if (typeof this.config.onInit === 'function') await this.config.onInit(this)
    }

    return payload
  }
}

const payload = new Payload()

export default payload
module.exports = payload
// Export RequestContext type
export type { RequestContext }
export * from './exports/auth'

export * from './exports/components'
export * from './exports/config'
export * from './exports/auth'
export * from './exports/database'
export * from './exports/errors'
export * from './exports/graphql'
export * from './exports/types'
export * from './exports/utilities'
export * from './exports/versions'
export * from './exports/components/elements'
export * from './exports/components/forms'
export * from './exports/components/hooks'
export * from './exports/components/icons'
export * from './exports/components/preferences'
export * from './exports/components/rich-text'
export * from './exports/components/templates'
export * from './exports/components/utilities'
