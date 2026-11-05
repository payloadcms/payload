import type { Payload } from 'payload'

import { expect, test } from 'tstyche'

declare module 'payload' {
  interface GeneratedTypes {
    collections: {
      posts: { _status?: 'draft' | 'published'; id: string; title: string }
    }
  }
}

declare const payload: Payload

test('should allow incomplete drafts when every collection has drafts enabled', () => {
  expect(payload.create).type.toBeCallableWith({ collection: 'posts', data: {}, draft: true })
})

test('should require complete published data when every collection has drafts enabled', () => {
  expect(payload.create).type.not.toBeCallableWith({ collection: 'posts', data: {} })
  expect(payload.create).type.not.toBeCallableWith({ collection: 'posts', data: {}, draft: false })
  expect(payload.create).type.toBeCallableWith({
    collection: 'posts',
    data: { title: 'Published' },
  })
})
