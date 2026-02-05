import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const tagsSlug = 'tags'
const postsSlug = 'posts'
const categoriesSlug = 'categories'

let payload: Payload

describe('Taxonomy', () => {
  beforeAll(async () => {
    const result = await initPayloadInt(dirname)
    payload = result.payload
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Collection Configuration', () => {
    it('should enable taxonomy on tags collection', () => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === (tagsSlug as string))

      expect(tagsCollection).toBeDefined()
      expect((tagsCollection as any)?.taxonomy).not.toBe(false)
      expect(tagsCollection?.admin?.custom?.isTaxonomy).toBe(true)
    })

    it('should enable hierarchy when taxonomy is enabled', () => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === (tagsSlug as string))

      expect((tagsCollection as any)?.hierarchy).not.toBe(false)
      expect((tagsCollection as any)?.hierarchy).toHaveProperty('parentFieldName')
    })

    it('should add parent field to taxonomy collection', () => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === (tagsSlug as string))
      const parentField = tagsCollection?.fields.find(
        (f: any) => f.name === 'parent' && f.type === 'relationship',
      )

      expect(parentField).toBeDefined()
      expect(parentField).toMatchObject({
        type: 'relationship',
        hasMany: false,
        relationTo: tagsSlug,
      })
    })

    it('should use custom parent field name', () => {
      const categoriesCollection = payload.config.collections.find(
        (c) => c.slug === (categoriesSlug as string),
      )
      const parentField = categoriesCollection?.fields.find(
        (f: any) => f.name === 'parentCategory' && f.type === 'relationship',
      )

      expect(parentField).toBeDefined()
      expect((categoriesCollection as any)?.taxonomy).toHaveProperty(
        'parentFieldName',
        'parentCategory',
      )
    })
  })

  describe('Hierarchy Operations', () => {
    const createdIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: tagsSlug as any })
      }
      createdIDs.length = 0
    })

    it('should create a root taxonomy item', async () => {
      const tag = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'Technology',
        } as any,
      })

      createdIDs.push(tag.id)

      expect(tag).toHaveProperty('name', 'Technology')
      expect((tag as any).parent).toBeUndefined()
    })

    it('should create a child taxonomy item', async () => {
      const parent = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'Technology',
        } as any,
      })

      createdIDs.push(parent.id)

      const child = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'JavaScript',
          parent: parent.id,
        } as any,
      })

      createdIDs.push(child.id)

      expect(child).toHaveProperty('name', 'JavaScript')
      expect((child as any).parent).toBe(parent.id)
    })

    it('should prevent circular references', async () => {
      const tag1 = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'Tag 1',
        } as any,
      })

      createdIDs.push(tag1.id)

      const tag2 = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'Tag 2',
          parent: tag1.id,
        } as any,
      })

      createdIDs.push(tag2.id)

      await expect(
        payload.update({
          id: tag1.id,
          collection: tagsSlug as any,
          data: {
            parent: tag2.id,
          } as any,
        }),
      ).rejects.toThrow(/circular/i)
    })

    it('should prevent self-referential parent', async () => {
      const tag = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'Test Tag',
        } as any,
      })

      createdIDs.push(tag.id)

      await expect(
        payload.update({
          id: tag.id,
          collection: tagsSlug as any,
          data: {
            parent: tag.id,
          } as any,
        }),
      ).rejects.toThrow(/own parent/i)
    })
  })

  describe('Related Collections', () => {
    const createdTagIDs: (number | string)[] = []
    const createdPostIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdPostIDs) {
        await payload.delete({ id, collection: postsSlug as any })
      }
      for (const id of createdTagIDs) {
        await payload.delete({ id, collection: tagsSlug as any })
      }
      createdTagIDs.length = 0
      createdPostIDs.length = 0
    })

    it('should create relationships to taxonomy', async () => {
      const tag = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'TypeScript',
        } as any,
      })

      createdTagIDs.push(tag.id)

      const post = await payload.create({
        collection: postsSlug as any,
        data: {
          tags: [tag.id],
          title: 'Getting Started with TypeScript',
        } as any,
      })

      createdPostIDs.push(post.id)

      expect((post as any).tags).toHaveLength(1)
      expect((post as any).tags[0]).toBe(tag.id)
    })

    it('should query documents by taxonomy', async () => {
      const tag = await payload.create({
        collection: tagsSlug as any,
        data: {
          name: 'React',
        } as any,
      })

      createdTagIDs.push(tag.id)

      const post1 = await payload.create({
        collection: postsSlug as any,
        data: {
          tags: [tag.id],
          title: 'React Hooks',
        } as any,
      })

      createdPostIDs.push(post1.id)

      const post2 = await payload.create({
        collection: postsSlug as any,
        data: {
          tags: [tag.id],
          title: 'React Components',
        } as any,
      })

      createdPostIDs.push(post2.id)

      const results = await payload.find({
        collection: postsSlug as any,
        where: {
          tags: {
            equals: tag.id,
          },
        },
      })

      expect(results.docs).toHaveLength(2)
      expect(results.docs.map((d: any) => d.title)).toContain('React Hooks')
      expect(results.docs.map((d: any) => d.title)).toContain('React Components')
    })
  })
})
