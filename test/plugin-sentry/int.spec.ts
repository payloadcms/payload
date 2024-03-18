import type { Payload } from '../../packages/payload/src/index.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'

let payload: Payload

describe('@payloadcms/plugin-sentry', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('tests', () => {
    it.todo('plugin-sentry tests')
  })
})
