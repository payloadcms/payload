import path from 'path'
import { fileURLToPath } from 'url'
import { validate as uuidValidate } from 'uuid'
import { expect } from 'vitest'

import { suite, test } from '../__helpers/int/vitest.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')

suite(
  'UUID v7 idType (postgres)',
  { config: './config.ts', db: (adapter) => adapter === 'postgres-uuidv7' },
  () => {
    test('should expose uuidv7 adapter idType', ({ payload }) => {
      expect(payload.db.idType).toBe('uuidv7')
    })

    test('should create a document with a valid UUID v7 default id', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'posts',
        data: { title: 'uuid v7 post' },
      })

      expect(typeof doc.id).toBe('string')
      expect(uuidValidate(doc.id)).toBe(true)
      expect(doc.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
      expect(doc.id.charAt(14)).toBe('7')
    })

    test('should order ids lexicographically for consecutive creates', async ({ payload }) => {
      const first = await payload.create({
        collection: 'posts',
        data: { title: 'first' },
      })
      const second = await payload.create({
        collection: 'posts',
        data: { title: 'second' },
      })

      expect(second.id > first.id).toBe(true)
    })

    test('should findByID with generated id', async ({ payload }) => {
      const created = await payload.create({
        collection: 'posts',
        data: { title: 'find me' },
      })

      const found = await payload.findByID({
        collection: 'posts',
        id: created.id,
      })

      expect(found.id).toBe(created.id)
      expect(found.title).toBe('find me')
    })

    test('should resolve relationship to category', async ({ payload }) => {
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

      expect(article.category).toMatchObject({ id: category.id })
    })

    test('should query by id equals', async ({ payload }) => {
      const created = await payload.create({
        collection: 'posts',
        data: { title: 'query by id' },
      })

      const res = await payload.find({
        collection: 'posts',
        where: { id: { equals: created.id } },
      })

      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(created.id)
    })
  },
)
