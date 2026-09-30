import type { Payload } from 'payload'

import { expect, test } from 'tstyche'

type RichText = {
  root: {
    children: { type: string; version: number }[]
    type: 'root'
    version: number
  }
}

type NestedData = {
  _status?: 'draft' | 'published'
  blocks: ({ alt: string; blockType: 'image' } | { blockType: 'text'; title: string })[]
  content: RichText
  id: string
  location: [number, number]
  related: { relationTo: 'posts'; value: { id: string; title: string } | string }
  rows: { details: { title: string }; label: string }[]
  seo: { metadata: { description: string } | null; title: string }
  tab: { title: string }
}

declare module 'payload' {
  interface GeneratedTypes {
    collections: { posts: NestedData }
    collectionsSelect: { posts: { blocks?: boolean; rows?: boolean; seo?: boolean } }
    globals: { settings: NestedData }
    globalsSelect: { settings: { blocks?: boolean; rows?: boolean; seo?: boolean } }
  }
}

declare const payload: Payload

test('should make nested group and named tab fields optional in draft reads', async () => {
  const post = await payload.findByID({ id: 'id', collection: 'posts', draft: true })
  const global = await payload.findGlobal({ slug: 'settings', draft: true })
  const result = await payload.find({ collection: 'posts', draft: true })

  if (post.seo && global.seo && result.docs[0]?.seo) {
    expect(post.seo.title).type.toBe<string | undefined>()
    expect(global.seo.title).type.toBe<string | undefined>()
    expect(result.docs[0].seo.title).type.toBe<string | undefined>()
    expect(post.seo.title).type.not.toBe<string>()
  }

  if (post.seo?.metadata) {
    expect(post.seo.metadata.description).type.toBe<string | undefined>()
  }

  if (global.tab) {
    expect(global.tab.title).type.toBe<string | undefined>()
  }

  expect(post.id).type.toBe<string>()
  expect(global.id).type.toBe<string>()
})

test('should make array and block fields optional while preserving block discrimination', async () => {
  const post = await payload.findByID({ id: 'id', collection: 'posts', draft: true })
  const global = await payload.findGlobal({ slug: 'settings', draft: true })

  for (const row of post.rows ?? []) {
    expect(row.label).type.toBe<string | undefined>()

    if (row.details) {
      expect(row.details.title).type.toBe<string | undefined>()
    }
  }

  for (const block of global.blocks ?? []) {
    expect(block.blockType).type.toBe<'image' | 'text'>()

    if (block.blockType === 'text') {
      expect(block.title).type.toBe<string | undefined>()
    } else {
      expect(block.alt).type.toBe<string | undefined>()
    }
  }
})

test('should preserve nested draft optionality in selected nullable reads', async () => {
  const post = await payload.findByID({
    id: 'id',
    collection: 'posts',
    disableErrors: true,
    draft: true,
    select: { seo: true },
  })
  const global = await payload.findGlobal({
    slug: 'settings',
    draft: true,
    select: { seo: true },
  })

  expect(post).type.toBeAssignableFrom<null>()
  expect(global).type.not.toHaveProperty('content')

  if (post?.seo && global.seo) {
    expect(post.seo.title).type.toBe<string | undefined>()
    expect(global.seo.title).type.toBe<string | undefined>()
    expect(post.id).type.toBe<string>()
    expect(global.id).type.toBe<string>()
  }
})

test('should keep published nested fields required', async () => {
  const post = await payload.findByID({ id: 'id', collection: 'posts' })
  const global = await payload.findGlobal({ slug: 'settings', draft: false })

  expect(post.seo.title).type.toBe<string>()
  expect(global.tab.title).type.toBe<string>()
})

test('should preserve serialized rich text when present in draft reads', async () => {
  const post = await payload.findByID({ id: 'id', collection: 'posts', draft: true })

  expect(post.content).type.toBe<RichText | undefined>()
  expect(post.location).type.toBe<[number, number] | undefined>()
})

test('should preserve relationship discriminators and populated IDs in draft reads', async () => {
  const post = await payload.findByID({ id: 'id', collection: 'posts', draft: true })

  if (post.related) {
    expect(post.related.relationTo).type.toBe<'posts'>()

    if (post.related.value && typeof post.related.value === 'object') {
      expect(post.related.value.id).type.toBe<string>()
      expect(post.related.value.title).type.toBe<string | undefined>()
    }
  }
})

test('should preserve nested draft optionality when the draft flag is a boolean', async () => {
  const isDraft = true as boolean
  const post = await payload.findByID({ id: 'id', collection: 'posts', draft: isDraft })
  const global = await payload.findGlobal({ slug: 'settings', draft: isDraft })

  if (post.seo && global.seo) {
    expect(post.seo.title).type.toBe<string | undefined>()
    expect(global.seo.title).type.toBe<string | undefined>()
  }
})
