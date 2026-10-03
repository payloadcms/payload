import type { Payload } from 'payload'

import { expect, test } from 'tstyche'

declare module 'payload' {
  interface GeneratedTypes {
    locale: 'en'
  }
}

declare const payload: Payload

test('should allow draft collection operations when generated types only define locales', () => {
  expect(payload.find).type.toBeCallableWith({ collection: 'custom', draft: true })
  expect(payload.findByID).type.toBeCallableWith({ id: 'id', collection: 'custom', draft: true })
  expect(payload.create).type.toBeCallableWith({ collection: 'custom', data: {}, draft: true })
  expect<typeof payload.update>().type.toBeCallableWith({
    id: 'id',
    collection: 'custom',
    data: {},
    draft: true,
  })
})

test('should allow draft global operations when generated types only define locales', () => {
  expect(payload.findGlobal).type.toBeCallableWith({ slug: 'custom', draft: true })
  expect(payload.updateGlobal).type.toBeCallableWith({ slug: 'custom', data: {}, draft: true })
})
