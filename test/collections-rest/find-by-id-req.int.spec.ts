import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './config.js'

test.suite('Collections REST - findByID request', { config: './config.ts' }, () => {
  test('should pass the incoming request to the database adapter', async ({ payload }) => {
    const post = await payload.create({
      collection: postsSlug,
      data: { title: 'find-by-id-req' },
      overrideAccess: true,
    })
    const req = await createPayloadRequest({ payload })
    const findOneSpy = vi.spyOn(payload.db, 'findOne')

    await payload.findByID({
      id: post.id,
      collection: postsSlug,
      overrideAccess: true,
      req,
    })

    const findOneReq = findOneSpy.mock.calls[0]?.[0].req

    findOneSpy.mockRestore()

    expect(findOneReq).toBe(req)
  })
})
