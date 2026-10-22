import type { Payload } from 'payload'

import { expect, test } from 'tstyche'

type NestedDocument = {
  _status?: 'draft' | 'published'
  blocks: { blockType: 'content'; title: string }[]
  group: { title: string }
  id: string
  items: { title: string }[]
}

declare module 'payload' {
  interface GeneratedTypes {
    collections: { posts: NestedDocument }
    globals: { settings: NestedDocument }
  }
}

declare const payload: Payload

test('should make draft collection containers optional while preserving nested field types', async () => {
  const doc = await payload.findByID({ id: 'id', collection: 'posts', draft: true })

  expect(doc.id).type.toBe<string>()
  expect(doc.group).type.toBe<{ title: string } | undefined>()
  expect(doc.items).type.toBe<{ title: string }[] | undefined>()
  expect(doc.blocks).type.toBe<{ blockType: 'content'; title: string }[] | undefined>()
})

test('should make draft global containers optional while preserving nested field types', async () => {
  const doc = await payload.findGlobal({ slug: 'settings', draft: true })

  expect(doc.id).type.toBe<string>()
  expect(doc.group).type.toBe<{ title: string } | undefined>()
  expect(doc.items).type.toBe<{ title: string }[] | undefined>()
  expect(doc.blocks).type.toBe<{ blockType: 'content'; title: string }[] | undefined>()
})
