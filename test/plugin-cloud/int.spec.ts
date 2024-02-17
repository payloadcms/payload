import type { Payload } from '../../packages/payload/src'

import { getPayload } from '../../packages/payload/src'
import { startMemoryDB } from '../startMemoryDB'
import configPromise from './config'

let payload: Payload

describe('@payloadcms/plugin-cloud', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
  })

  describe('tests', () => {
    it.todo('plugin-cloud tests')
  })
})
