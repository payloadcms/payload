import type { CollectionSlug, GlobalSlug, Payload, RequiredDataFromCollectionSlug } from 'payload'

import { expect, test } from 'tstyche'

declare module 'payload' {
  interface GeneratedTypes {
    collections: {
      pages: { id: string; title: string }
      posts: { _status?: 'draft' | 'published'; id: string; title: string }
    }
    globals: {
      footer: { id: string; title: string }
      settings: { _status?: 'draft' | 'published'; id: string; title: string }
    }
  }
}

declare const payload: Payload

test('should reject draft reads while a generic collection slug is unresolved', () => {
  function getDocuments<T extends CollectionSlug>({
    collection,
    draft,
  }: {
    collection: T
    draft: boolean
  }) {
    // @ts-expect-error! -- A free slug parameter cannot resolve the draft conditional.
    return payload.find({ collection, draft })
  }

  expect(getDocuments).type.toBeCallableWith({ collection: 'posts', draft: true })
})

test('should reject draft reads while a generic global slug is unresolved', () => {
  function getGlobal<T extends GlobalSlug>({ slug, draft }: { draft: boolean; slug: T }) {
    // @ts-expect-error! -- A free slug parameter cannot resolve the draft conditional.
    return payload.findGlobal({ slug, draft })
  }

  expect(getGlobal).type.toBeCallableWith({ slug: 'settings', draft: true })
})

test('should reject published creation while a generic collection slug is unresolved', () => {
  function createDocument<T extends CollectionSlug>({
    collection,
    data,
  }: {
    collection: T
    data: RequiredDataFromCollectionSlug<T>
  }) {
    // @ts-expect-error! -- Even published creates cannot resolve the free slug's draft conditional.
    return payload.create({ collection, data })
  }

  expect(createDocument).type.toBeCallableWith({
    collection: 'posts',
    data: { title: 'Published' },
  })
})

test('should allow collection reads widened to the complete slug union', async () => {
  function getDocuments({ collection, draft }: { collection: CollectionSlug; draft: boolean }) {
    return payload.find({ collection, draft })
  }

  const result = await getDocuments({ collection: 'posts', draft: true })

  expect(result.docs[0]!.id).type.toBe<string>()
  expect(result.docs[0]!.title).type.toBe<string | undefined>()
})

test('should allow global reads widened to the complete slug union', async () => {
  function getGlobal({ slug, draft }: { draft: boolean; slug: GlobalSlug }) {
    return payload.findGlobal({ slug, draft })
  }

  const result = await getGlobal({ slug: 'settings', draft: true })

  expect(result.id).type.toBe<string>()
  expect(result.title).type.toBe<string | undefined>()
})
