import type { ApplyDepth, PaginatedDocs } from 'payload'

import payload from 'payload'
import { describe, expect, test } from 'tstyche'

import type { Post } from './payload-types.js'

describe('Relationships types', () => {
  test("Depth types don't matter if typescript.typeSafeDepth is not enabled", () => {
    expect({} as ApplyDepth<Post, 100>).type.toBe<Post>()

    expect(payload.find({ collection: 'posts', depth: 110 })).type.toBe<
      Promise<PaginatedDocs<Post>>
    >()
  })
})
