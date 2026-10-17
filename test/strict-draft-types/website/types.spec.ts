import type { Payload } from 'payload'

import { PostHero } from '@/heros/PostHero'
import { expect, test } from 'tstyche'

declare const payload: Payload
declare const draft: boolean

test('should accept a post queried with a draft mode flag', async () => {
  const { docs } = await payload.find({ collection: 'posts', draft })

  expect(PostHero).type.toBeCallableWith({ post: docs[0]! })
})
