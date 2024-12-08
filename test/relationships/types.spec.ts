import type { BulkOperationResult, PaginatedDocs } from 'payload'

import payload from 'payload'
import { describe, expect, test } from 'tstyche'

import type { Post } from './payload-types.js'

describe('Relationships types', () => {
  test("Depth types don't matter if typescript.typeSafeDepth is not enabled", () => {
    expect(payload.find({ collection: 'posts', depth: 110 })).type.toBe<
      Promise<PaginatedDocs<Post>>
    >()

    expect(payload.create({ collection: 'posts', depth: 20, data: {} as Post })).type.toBe<
      Promise<Post>
    >()

    expect(payload.update({ collection: 'posts', where: {}, data: {} })).type.toBe<
      Promise<BulkOperationResult<'posts'>>
    >()
  })
})
