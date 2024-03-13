import type { Payload } from '../../packages/payload/src/index.js'
import { getPayload } from '../../packages/payload/src/index.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'

let payload: Payload

describe('@payloadcms/plugin-cloud', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('tests', () => {
    it.todo('plugin-cloud tests')
  })
})
