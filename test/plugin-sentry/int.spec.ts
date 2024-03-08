import type { Payload } from '../../packages/payload/src/index.js'

import { getPayload } from '../../packages/payload/src/index.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'

let payload: Payload

describe('@payloadcms/plugin-sentry', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
  })

  describe('tests', () => {
    it.todo('plugin-sentry tests')
  })
})
