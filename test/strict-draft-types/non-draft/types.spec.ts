import type { Payload } from 'payload'

import { expect, test } from 'tstyche'

declare module 'payload' {
  interface GeneratedTypes {
    collections: {
      pages: { id: string; title: string }
    }
  }
}

declare const payload: Payload

test('should reject draft creation when the sole collection has no drafts', () => {
  expect(payload.create).type.not.toBeCallableWith({
    collection: 'pages',
    data: { title: 'Page' },
    draft: true,
  })
  expect(payload.create).type.not.toBeCallableWith({
    collection: 'pages',
    data: { title: 'Page' },
    draft: false,
  })
  expect(payload.create).type.toBeCallableWith({ collection: 'pages', data: { title: 'Page' } })
})
