import type { ArrayField, Payload, RelationshipField } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Page } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-nested-docs', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
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

      const firstUpdatedChildBreadcrumbs = docs[0]?.breadcrumbs
      const lastUpdatedChildBreadcrumbs = docs[10]?.breadcrumbs

      expect(firstUpdatedChildBreadcrumbs).toHaveLength(2)
      // @ts-ignore
      expect(firstUpdatedChildBreadcrumbs[0].url).toStrictEqual('/11-children-updated')

      expect(firstUpdatedChildBreadcrumbs).toBeDefined()
      // @ts-ignore
      expect(lastUpdatedChildBreadcrumbs[0].url).toStrictEqual('/11-children-updated')
    })

    it('should return breadcrumbs as an array of objects', async () => {
      const parentDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'parent doc',
          slug: 'parent-doc',
          _status: 'published',
        },
      })

      const childDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'child doc',
          slug: 'child-doc',
          parent: parentDoc.id,
          _status: 'published',
        },
      })

      // expect breadcrumbs to be an array
      expect(childDoc.breadcrumbs).toBeInstanceOf(Array)
      expect(childDoc.breadcrumbs).toBeDefined()

      // expect each to be objects
      childDoc.breadcrumbs?.map((breadcrumb) => {
        expect(breadcrumb).toBeInstanceOf(Object)
      })
    })

    it('should update child doc breadcrumb without affecting any other data', async () => {
      const parentDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'parent doc',
          slug: 'parent',
        },
      })

      const childDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'child doc',
          slug: 'child',
          parent: parentDoc.id,
          _status: 'published',
        },
      })

      await payload.update({
        collection: 'pages',
        id: parentDoc.id,
        data: {
          title: 'parent updated',
          slug: 'parent-updated',
          _status: 'published',
        },
      })

      const updatedChild = await payload
        .find({
          collection: 'pages',
          where: {
            id: {
              equals: childDoc.id,
            },
          },
        })
        .then(({ docs }) => docs[0])

      // breadcrumbs should be updated
      expect(updatedChild!.breadcrumbs).toHaveLength(2)

      expect(updatedChild!.breadcrumbs?.[0]?.url).toStrictEqual('/parent-updated')
      expect(updatedChild!.breadcrumbs?.[1]?.url).toStrictEqual('/parent-updated/child')

      // no other data should be affected
      expect(updatedChild!.title).toEqual('child doc')
      expect(updatedChild!.slug).toEqual('child')
    })
  })

  describe('versions', () => {
    it('should preserve published version of child when parent is saved and child has unpublished draft', async () => {
      // Step 1: Create parent page and publish it
      const parentDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'Version Parent',
          slug: 'version-parent',
          _status: 'published',
        },
      })

      // Step 2: Create child page and publish it
      const childDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'Version Child',
          slug: 'version-child',
          parent: parentDoc.id,
          _status: 'published',
        },
      })

      // Verify initial published state
      const initialPublished = await payload.findByID({
        id: childDoc.id,
        collection: 'pages',
        draft: false,
      })
      expect(initialPublished._status).toBe('published')
      expect(initialPublished.breadcrumbs).toHaveLength(2)

      // Step 3: Make unpublished changes to child (creates a draft version)
      await payload.update({
        id: childDoc.id,
        collection: 'pages',
        data: {
          title: 'Version Child Draft Edit',
        },
        draft: true,
      })

      // Step 4: Re-publish the parent (triggers resaveChildren)
      await payload.update({
        id: parentDoc.id,
        collection: 'pages',
        data: {
          title: 'Version Parent Updated',
          slug: 'version-parent-updated',
          _status: 'published',
        },
      })

      // Step 5: Verify the child's published version is still accessible
      const publishedChild = await payload.findByID({
        id: childDoc.id,
        collection: 'pages',
        draft: false,
      })

      expect(publishedChild).toBeDefined()
      expect(publishedChild._status).toBe('published')
      expect(publishedChild.breadcrumbs).toHaveLength(2)
      expect(publishedChild.breadcrumbs?.[0]?.url).toBe('/version-parent-updated')

      // Step 6: Verify the draft version is also still accessible
      const draftChild = await payload.findByID({
        id: childDoc.id,
        collection: 'pages',
        draft: true,
      })

      expect(draftChild).toBeDefined()
      expect(draftChild.title).toBe('Version Child Draft Edit')
    })

    it('should update breadcrumbs for draft-only children when parent is saved', async () => {
      const parentDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'Draft Parent',
          slug: 'draft-parent',
          _status: 'published',
        },
      })

      // Create a child that is never published (draft-only)
      const draftChild = await payload.create({
        collection: 'pages',
        data: {
          title: 'Draft Only Child',
          slug: 'draft-only-child',
          parent: parentDoc.id,
          _status: 'draft',
        },
      })

      expect(draftChild._status).toBe('draft')

      // Update the parent
      await payload.update({
        id: parentDoc.id,
        collection: 'pages',
        data: {
          title: 'Draft Parent Updated',
          slug: 'draft-parent-updated',
          _status: 'published',
        },
      })

      // Draft-only child should have updated breadcrumbs
      const updatedDraftChild = await payload.findByID({
        id: draftChild.id,
        collection: 'pages',
        draft: true,
      })

      expect(updatedDraftChild.breadcrumbs).toHaveLength(2)
      expect(updatedDraftChild.breadcrumbs?.[0]?.url).toBe('/draft-parent-updated')
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
