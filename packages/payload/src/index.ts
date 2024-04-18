import type { TypeWithID } from './collections/config/types'
import type { InitOptions } from './config/types'
import type { BaseDatabaseAdapter } from './database/types'
import type { RequestContext } from './express/types'
import type { TypeWithID as GlobalTypeWithID } from './globals/config/types'
import type { Payload as LocalPayload } from './payload'

import { initHTTP } from './initHTTP'
import { BasePayload } from './payload'

export { getPayload } from './payload'

require('isomorphic-fetch')

export class Payload extends BasePayload<GeneratedTypes> {
  async init(options: InitOptions): Promise<LocalPayload> {
    const payload = await initHTTP(options)
    Object.assign(this, payload)

    if (!options.disableOnInit) {
      if (typeof options.onInit === 'function') await options.onInit(this)
      if (typeof this.config.onInit === 'function') await this.config.onInit(this)
    }

    return payload
  }
}

const payload = new Payload()

export default payload
module.exports = payload
exports = module.exports
exports.Payload = Payload

type GeneratedTypes = {
  collections: {
    [slug: number | string | symbol]: TypeWithID & Record<string, unknown>
  }
  globals: {
    [slug: number | string | symbol]: GlobalTypeWithID & Record<string, unknown>
  }
}

type DatabaseAdapter = BaseDatabaseAdapter

export type { DatabaseAdapter, GeneratedTypes, RequestContext }
