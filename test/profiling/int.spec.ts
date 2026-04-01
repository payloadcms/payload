import type { Payload } from 'payload'

import { performance } from 'perf_hooks'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload

describe('sanitizeConfig profiling', () => {
  beforeAll(() => {
    process.env.PAYLOAD_DEBUG_TIMING = 'true'
  })

  afterAll(async () => {
    if (payload) {
      await payload.db.destroy()
    }
    delete process.env.PAYLOAD_DEBUG_TIMING
  })

  it('should profile sanitizeConfig and output timing breakdown', async () => {
    const startTime = performance.now()

    ;({ payload } = await initPayloadInt((await import('./config.js')).default))

    const totalTime = performance.now() - startTime

    console.log(`\nTotal init time: ${totalTime.toFixed(2)}ms`)

    // Verify payload initialized
    expect(payload).toBeDefined()
    expect(payload.collections['collection-0']).toBeDefined()
  })
})
