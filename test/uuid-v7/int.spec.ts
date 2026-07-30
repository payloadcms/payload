import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { validate as uuidValidate } from 'uuid'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')

type UuidV7Collection = 'articles' | 'categories' | 'posts'

const describeUuidV7 = process.env.PAYLOAD_DATABASE === 'postgres-uuidv7' ? describe : describe.skip

describeUuidV7('UUID v7 idType (postgres)', () => {
  let payload: Payload

  /** Created in order; deleted in reverse (articles → categories → posts). */
  const createdStack: { collection: UuidV7Collection; id: string }[] = []

  const track = (collection: UuidV7Collection, id: string) => {
    createdStack.push({ collection, id })
  }

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterEach(async () => {
    if (!payload) {
      return
    }

    for (const { collection, id } of [...createdStack].reverse()) {
      try {
        await payload.delete({ collection, id })
      } catch {
        // ignore: already deleted or FK race
      }
    }

    createdStack.length = 0
  })

  afterAll(async () => {
    if (payload) {
      await payload.destroy()
    }
  })

  it('should expose uuidv7 adapter idType', () => {
    expect(payload.db.idType).toBe('uuidv7')
  })

  it('should create a document with a valid UUID v7 default id', async () => {
    const doc = await payload.create({
      collection: 'posts',
      data: { title: 'uuid v7 post' },
    })

    track('posts', String(doc.id))

    expect(typeof doc.id).toBe('string')
    expect(uuidValidate(doc.id)).toBe(true)
    expect(doc.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(doc.id.charAt(14)).toBe('7')
  })

  it('should order ids lexicographically for consecutive creates', async () => {
    const first = await payload.create({
      collection: 'posts',
      data: { title: 'first' },
    })
    const second = await payload.create({
      collection: 'posts',
      data: { title: 'second' },
    })

    track('posts', String(first.id))
    track('posts', String(second.id))

    expect(second.id > first.id).toBe(true)
  })

  it('should findByID with generated id', async () => {
    const created = await payload.create({
      collection: 'posts',
      data: { title: 'find me' },
    })

    track('posts', String(created.id))

    const found = await payload.findByID({
      collection: 'posts',
      id: created.id,
    })

    expect(found.id).toBe(created.id)
    expect(found.title).toBe('find me')
  })

  it('should resolve relationship to category', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: 'Cat A' },
    })
    const article = await payload.create({
      collection: 'articles',
      data: {
        title: 'Article 1',
        category: category.id,
      },
      depth: 1,
    })

    track('articles', String(article.id))
    track('categories', String(category.id))

    expect(article.category).toMatchObject({ id: category.id })
  })

  it('should query by id equals', async () => {
    const created = await payload.create({
      collection: 'posts',
      data: { title: 'query by id' },
    })

    track('posts', String(created.id))

    const res = await payload.find({
      collection: 'posts',
      where: { id: { equals: created.id } },
    })

    expect(res.docs).toHaveLength(1)
    expect(res.docs[0].id).toBe(created.id)
  })
})
