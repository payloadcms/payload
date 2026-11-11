import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { postsSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('Collections REST - findByID request', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should pass the incoming request to the database adapter', async () => {
    const post = await payload.create({
      collection: postsSlug,
      data: { title: 'find-by-id-req' },
      overrideAccess: true,
    })
    const req = await createLocalReq({}, payload)
    const findOneSpy = vi.spyOn(payload.db, 'findOne')

    await payload.findByID({
      id: post.id,
      collection: postsSlug,
      overrideAccess: true,
      req,
    })

    const findOneReq = findOneSpy.mock.calls[0]?.[0].req

    findOneSpy.mockRestore()

    await payload.delete({ id: post.id, collection: postsSlug, overrideAccess: true })

    expect(findOneReq).toBe(req)
  })
})
