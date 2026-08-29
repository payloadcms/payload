import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-search — search-doc write errors', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload?.destroy === 'function') {
      await payload.destroy()
    }
  })

  it('surfaces a search-doc write failure instead of silently rolling back the publish', async () => {
    // First published post: its search doc writes fine (dedupeKey = 'constant').
    await payload.create({
      collection: 'posts',
      data: { title: 'first', _status: 'published' },
    })

    // Second published post: its search doc collides on the unique `dedupeKey`,
    // raising an E11000 write error inside the shared publish transaction.
    // plugin-search catches it and only logs it, so create() resolves without
    // throwing while the aborted transaction rolls this post's publish back.
    let threw = false
    try {
      await payload.create({
        collection: 'posts',
        data: { title: 'second', _status: 'published' },
      })
    } catch {
      threw = true
    }

    const { totalDocs } = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
    })

    // Desired behaviour: the second publish either surfaces a visible error, or
    // it persists. On current `main` it does neither — create() resolved, but the
    // row was rolled back, so only the first post survives (silent data loss).
    expect(threw || totalDocs === 2).toBe(true)
  })
})
