import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { pagesSlug } from './config.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Collections - Plugins', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('created pages collection', async () => {
    const { id } = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Test Page',
      },
    })

    expect(id).toBeDefined()
  })

  describe('plugin priority', () => {
    it('should execute plugins sorted by priority regardless of array order', () => {
      // The reader plugin (priority 10) is listed BEFORE the writer (priority 1) in the
      // plugins array, but priority sorting ensures the writer runs first.
      // If sorting didn't work, the reader would see null instead of the writer's value.
      expect(payload.config.custom?.readerSawValue).toBe('written-by-low-priority')
    })
  })
})
