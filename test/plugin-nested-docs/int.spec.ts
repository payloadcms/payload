import type { ArrayField, Payload, RelationshipField } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { Page } from './payload-types.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-nested-docs', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('seed', () => {
    it('should populate two levels of breadcrumbs', async () => {
      const query = await payload.find({
        collection: 'pages',
        where: {
          slug: {
            equals: 'child-page',
          },
        },
      })

      expect(query.docs[0].breadcrumbs).toHaveLength(2)
    })

    it('should populate three levels of breadcrumbs', async () => {
      const query = await payload.find({
        collection: 'pages',
        where: {
          slug: {
            equals: 'grandchild-page',
          },
        },
      })

      expect(query.docs[0].breadcrumbs).toHaveLength(3)
      expect(query.docs[0].breadcrumbs[0].url).toStrictEqual('/parent-page')
      expect(query.docs[0].breadcrumbs[1].url).toStrictEqual('/parent-page/child-page')
      expect(query.docs[0].breadcrumbs[2].url).toStrictEqual(
        '/parent-page/child-page/grandchild-page',
      )
    })

    it('should update more than 10 (default limit) breadcrumbs', async () => {
      // create a parent doc
      const parentDoc = await payload.create({
        collection: 'pages',
        data: {
          title: '11 children',
          slug: '11-children',
        },
      })

      // create 11 children docs
      for (let i = 0; i < 11; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Child ${i + 1}`,
            slug: `child-${i + 1}`,
            parent: parentDoc.id,
            _status: 'published',
          },
        })
      }

      // update parent doc
      await payload.update({
        collection: 'pages',
        id: parentDoc.id,
        data: {
          title: '11 children updated',
          slug: '11-children-updated',
          _status: 'published',
        },
      })

      // read children docs
      const { docs } = await payload.find({
        collection: 'pages',
        limit: 0,
        where: {
          parent: {
            equals: parentDoc.id,
          },
        },
      })

      const firstUpdatedChildBreadcrumbs = docs[0]?.breadcrumbs as Page['breadcrumbs']
      const lastUpdatedChildBreadcrumbs = docs[10]?.breadcrumbs as Page['breadcrumbs']

      expect(firstUpdatedChildBreadcrumbs).toHaveLength(2)
      // @ts-ignore
      expect(firstUpdatedChildBreadcrumbs[0].url).toStrictEqual('/11-children-updated')

      expect(firstUpdatedChildBreadcrumbs).toBeDefined()
      // @ts-ignore
      expect(lastUpdatedChildBreadcrumbs[0].url).toStrictEqual('/11-children-updated')
    })
  })

  describe('overrides', () => {
    let collection
    beforeAll(() => {
      collection = payload.config.collections.find(({ slug }) => slug === 'categories')
    })

    it('should allow overriding breadcrumbs field', () => {
      const breadcrumbField = collection.fields.find(
        (field) => field.type === 'array' && field.name === 'categorization',
      ) as ArrayField
      const customField = breadcrumbField.fields.find(
        (field) => field.type === 'text' && field.name === 'test',
      ) as ArrayField

      expect(breadcrumbField.admin.description).toStrictEqual('custom')
      expect(customField).toBeDefined()
      expect(breadcrumbField.admin.readOnly).toStrictEqual(true)
      expect(breadcrumbField.admin.readOnly).toStrictEqual(true)
    })

    it('should allow overriding parent field', () => {
      const parentField = collection.fields.find(
        (field) => field.type === 'relationship' && field.name === 'owner',
      ) as RelationshipField

      expect(parentField.admin.description).toStrictEqual('custom')
    })

    it('should allow custom breadcrumb and parent slugs', async () => {
      const parent = await payload.create({
        collection: 'categories',
        data: {
          name: 'parent',
        },
      })
      const child = await payload.create({
        collection: 'categories',
        data: {
          name: 'child',
          owner: parent.id,
        },
      })
      const grandchild = await payload.create({
        collection: 'categories',
        data: {
          name: 'grandchild',
          owner: child.id,
        },
      })

      expect(grandchild.categorization[0].doc).toStrictEqual(parent.id)
      expect(grandchild.categorization[0].label).toStrictEqual('parent')
      expect(grandchild.categorization[1].doc).toStrictEqual(child.id)
      expect(grandchild.categorization[1].label).toStrictEqual('child')
      expect(grandchild.categorization[2].label).toStrictEqual('grandchild')
    })
  })
})
