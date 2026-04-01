import type { Payload } from 'payload'

import path from 'path'
import { performance } from 'perf_hooks'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect } from 'vitest'

import { it } from '../__helpers/int/vitest.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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

    ;({ payload } = await initPayloadInt(dirname))

    const totalTime = performance.now() - startTime

    console.log(`\nTotal init time: ${totalTime.toFixed(2)}ms`)

    // Verify payload initialized
    expect(payload).toBeDefined()
    expect(payload.collections['collection-0']).toBeDefined()
  })
})
