import type { ArrayField, RelationshipField } from '../../packages/payload/src/fields/config/types'

import payload from '../../packages/payload/src'
import getParents from '../../packages/plugin-nested-docs/src/utilities/getParents'
import { initPayloadTest } from '../helpers/configHelpers'

jest.mock('../../packages/plugin-nested-docs/src/utilities/getParents', () => {
  const original = jest.requireActual('../../packages/plugin-nested-docs/src/utilities/getParents')
  return {
    __esModule: true,
    default: jest.fn(original.default),
  }
})

describe('Nested Docs', () => {
  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } })
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

    it('should populate breadcrumbs with custom field for url', async () => {
      const query = await payload.find({
        collection: 'tags',
        where: {
          tagName: {
            equals: 'tag-1',
          },
        },
      })

      expect(query.docs[0].breadcrumbs[0].url).toStrictEqual('/tag-uri')
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

  describe('performance', () => {
    let tagRef

    beforeEach(() => {
      jest.clearAllMocks()
    })

    beforeAll(async () => {
      tagRef = await payload.find({
        collection: 'tags',
        where: {
          tagName: {
            equals: 'tag-1',
          },
        },
      })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it('should not call getParents if the values are the same', async () => {
      const newTagValue = await payload.update({
        collection: 'tags',
        id: tagRef.docs[0].id,
        data: {
          uri: 'tag-uri',
        },
      })

      expect(getParents).toHaveBeenCalledTimes(0)
      expect(newTagValue.breadcrumbs[0].url).toStrictEqual('/tag-uri')
    })

    it('should call getParents when the values change', async () => {
      const newTagValue = await payload.update({
        collection: 'tags',
        id: tagRef.docs[0].id,
        data: {
          uri: 'new-uri',
        },
      })

      expect(getParents).toHaveBeenCalledTimes(1)
      expect(newTagValue.breadcrumbs[0].url).toStrictEqual('/new-uri')
    })
  })
})
