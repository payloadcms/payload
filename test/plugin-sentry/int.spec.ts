import type { Payload } from 'payload'
import { describe, beforeAll, afterAll, it } from 'vitest'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '@tools/test-utils/int'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-sentry', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('tests', () => {
    it.todo('plugin-sentry tests')
  })
})
