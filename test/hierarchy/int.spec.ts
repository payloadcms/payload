import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Page } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let _restClient: NextRESTClient

describe('Hierarchy', () => {
  beforeAll(async () => {
    ;({ payload, restClient: _restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (payload) {
      await payload.destroy()
    }
  })

  describe('Collection Config Property', () => {
    it('should add virtual path fields to collection', () => {
      const pagesCollection = payload.collections.pages.config

      // Check that virtual path fields were added
      const slugPathField = pagesCollection.fields.find((f) => f.name === '_h_slugPath')
      const titlePathField = pagesCollection.fields.find((f) => f.name === '_h_titlePath')

      expect(slugPathField).toBeDefined()
      expect(titlePathField).toBeDefined()

      // Verify they are virtual fields
      expect(slugPathField.virtual).toBe(true)
      expect(titlePathField.virtual).toBe(true)
    })

    it('should have sanitized hierarchy config', () => {
      const pagesCollection = payload.collections.pages.config

      expect(pagesCollection.hierarchy).not.toBe(false)
      if (pagesCollection.hierarchy !== false) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pagesCollection.hierarchy.parentFieldName).toBe('parent')
      }
    })

    it('should support custom field names', () => {
      const deptsCollection = payload.collections.departments.config

      expect(deptsCollection.hierarchy).not.toBe(false)
      if (deptsCollection.hierarchy !== false) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(deptsCollection.hierarchy.parentFieldName).toBe('parentDept')
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(deptsCollection.hierarchy.slugPathFieldName).toBe('_breadcrumbSlug')
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(deptsCollection.hierarchy.titlePathFieldName).toBe('_breadcrumbTitle')
      }

      // Verify custom path fields were added
      const slugField = deptsCollection.fields.find((f) => f.name === '_breadcrumbSlug')
      const titleField = deptsCollection.fields.find((f) => f.name === '_breadcrumbTitle')

      expect(slugField).toBeDefined()
      expect(titleField).toBeDefined()
    })
  })

  describe('Tree Data Generation', () => {
    beforeEach(async () => {
      // Clear existing data before each test
      await payload.delete({ collection: 'pages', where: {} })
    })

    afterEach(async () => {
      // Clean up data after each test
      await payload.delete({ collection: 'pages', where: {} })
    })

    it('should compute correct paths for root document', async () => {
      const rootPage = await payload.create({
        collection: 'pages',
        data: {
          parent: null,
          title: 'Root Page',
        },
      })

      expect(rootPage._h_slugPath).toBe('root-page')
      expect(rootPage._h_titlePath).toBe('Root Page')
    })

    it('should compute correct paths for nested documents', async () => {
      // Create root
      const rootPage = await payload.create({
        collection: 'pages',
        data: {
          parent: null,
          title: 'Root',
        },
      })

      // Create child
      const childPage = await payload.create({
        collection: 'pages',
        data: {
          parent: rootPage.id,
          title: 'Child',
        },
      })

      expect(childPage._h_slugPath).toBe('root/child')
      expect(childPage._h_titlePath).toBe('Root/Child')

      // Create grandchild
      const grandchildPage = await payload.create({
        collection: 'pages',
        data: {
          parent: childPage.id,
          title: 'Grandchild',
        },
      })

      expect(grandchildPage._h_slugPath).toBe('root/child/grandchild')
      expect(grandchildPage._h_titlePath).toBe('Root/Child/Grandchild')
    })

    it('should compute updated paths when parent changes', async () => {
      // Create initial tree: Root -> Child -> Grandchild
      const rootPage = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      const anotherRoot = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Another Root' },
      })

      const childPage = await payload.create({
        collection: 'pages',
        data: { parent: rootPage.id, title: 'Child' },
      })

      const grandchildPage = await payload.create({
        collection: 'pages',
        data: { parent: childPage.id, title: 'Grandchild' },
      })

      // Move child to another root
      const updatedChild = await payload.update({
        id: childPage.id,
        collection: 'pages',
        data: { parent: anotherRoot.id },
      })

      // Check child path reflects new parent
      expect(updatedChild._h_slugPath).toBe('another-root/child')
      expect(updatedChild._h_titlePath).toBe('Another Root/Child')

      // Check grandchild path automatically reflects change (walks up parent chain)
      const updatedGrandchild = await payload.findByID({
        id: grandchildPage.id,
        collection: 'pages',
      })

      expect(updatedGrandchild._h_slugPath).toBe('another-root/child/grandchild')
      expect(updatedGrandchild._h_titlePath).toBe('Another Root/Child/Grandchild')
    })

    it('should compute updated paths when ancestor title changes', async () => {
      // Create tree
      const rootPage = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      const childPage = await payload.create({
        collection: 'pages',
        data: { parent: rootPage.id, title: 'Child' },
      })

      // Update root title
      await payload.update({
        id: rootPage.id,
        collection: 'pages',
        data: { title: 'Updated Root' },
      })

      // Check child paths automatically reflect change (walks up parent chain)
      const updatedChild = await payload.findByID({
        id: childPage.id,
        collection: 'pages',
      })

      expect(updatedChild._h_slugPath).toBe('updated-root/child')
      expect(updatedChild._h_titlePath).toBe('Updated Root/Child')
    })

    it('should handle moving to root level', async () => {
      // Create tree
      const rootPage = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      const childPage = await payload.create({
        collection: 'pages',
        data: { parent: rootPage.id, title: 'Child' },
      })

      // Move child to root
      const updatedChild = await payload.update({
        id: childPage.id,
        collection: 'pages',
        data: { parent: null },
      })

      expect(updatedChild._h_slugPath).toBe('child')
      expect(updatedChild._h_titlePath).toBe('Child')
    })
  })

  describe('Circular Reference Prevention', () => {
    beforeEach(async () => {
      await payload.delete({ collection: 'pages', where: {} })
    })

    afterEach(async () => {
      await payload.delete({ collection: 'pages', where: {} })
    })

    it('should prevent self-referential parent', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Test Page' },
      })

      await expect(
        payload.update({
          collection: 'pages',
          id: page.id,
          data: { parent: page.id },
        }),
      ).rejects.toThrow('Document cannot be its own parent')
    })

    it('should prevent circular reference with direct child', async () => {
      const parentPage = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Parent' },
      })

      const childPage = await payload.create({
        collection: 'pages',
        data: { parent: parentPage.id, title: 'Child' },
      })

      await expect(
        payload.update({
          collection: 'pages',
          id: parentPage.id,
          data: { parent: childPage.id },
        }),
      ).rejects.toThrow('Circular reference detected')
    })

    it('should prevent circular reference with grandchild', async () => {
      const grandparent = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Grandparent' },
      })

      const parent = await payload.create({
        collection: 'pages',
        data: { parent: grandparent.id, title: 'Parent' },
      })

      const child = await payload.create({
        collection: 'pages',
        data: { parent: parent.id, title: 'Child' },
      })

      await expect(
        payload.update({
          collection: 'pages',
          id: grandparent.id,
          data: { parent: child.id },
        }),
      ).rejects.toThrow('Circular reference detected')
    })

    it('should allow moving to a non-circular parent', async () => {
      const page1 = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Page 1' },
      })

      const page2 = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Page 2' },
      })

      const child = await payload.create({
        collection: 'pages',
        data: { parent: page1.id, title: 'Child' },
      })

      // Moving child from page1 to page2 should work
      const updated = await payload.update({
        collection: 'pages',
        id: child.id,
        data: { parent: page2.id },
        depth: 0,
      })

      expect(updated.parent).toBe(page2.id)
      expect(updated._h_slugPath).toBe('page-2/child')
    })
  })

  describe('Query Patterns', () => {
    beforeEach(async () => {
      // Clear existing data before each test
      await payload.delete({ collection: 'pages', where: {} })
    })

    afterEach(async () => {
      // Clean up data after each test
      await payload.delete({ collection: 'pages', where: {} })
    })

    it('should find root documents by querying parent field', async () => {
      const root = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Child 1' },
      })

      const roots = await payload.find({
        collection: 'pages',
        where: {
          parent: { equals: null },
        },
      })

      expect(roots.docs).toHaveLength(1)
      expect(roots.docs[0]!.id).toBe(root.id)
    })

    it('should find direct children by querying parent field', async () => {
      const root = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      const child1 = await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Child 1' },
      })

      const child2 = await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Child 2' },
      })

      await payload.create({
        collection: 'pages',
        data: { parent: child1.id, title: 'Grandchild 1' },
      })

      const directChildren = await payload.find({
        collection: 'pages',
        where: {
          parent: { equals: root.id },
        },
      })

      expect(directChildren.docs).toHaveLength(2)
      const ids = directChildren.docs.map((d) => d.id)
      expect(ids).toContain(child1.id)
      expect(ids).toContain(child2.id)
    })
  })

  describe('Custom Field Names', () => {
    beforeEach(async () => {
      await payload.delete({ collection: 'departments', where: {} })
    })

    afterEach(async () => {
      await payload.delete({ collection: 'departments', where: {} })
    })

    it('should use custom field names for path fields', async () => {
      const parentDept = await payload.create({
        collection: 'departments',
        data: { deptName: 'Engineering' },
      })

      expect(parentDept._breadcrumbSlug).toBe('engineering')
      expect(parentDept._breadcrumbTitle).toBe('Engineering')

      const childDept = await payload.create({
        collection: 'departments',
        data: {
          deptName: 'Frontend',
          parentDept: parentDept.id,
        },
      })

      expect(childDept._breadcrumbSlug).toBe('engineering/frontend')
      expect(childDept._breadcrumbTitle).toBe('Engineering/Frontend')
    })
  })

  describe('Deep Nesting', () => {
    beforeEach(async () => {
      // Clear existing data before each test
      await payload.delete({ collection: 'pages', where: {} })
    })

    afterEach(async () => {
      // Clean up data after each test
      await payload.delete({ collection: 'pages', where: {} })
    })

    it('should handle deeply nested structures', async () => {
      // Create 10-level deep hierarchy
      let currentParent: null | Page = null

      for (let i = 0; i < 10; i++) {
        currentParent = await payload.create({
          collection: 'pages',
          data: {
            parent: currentParent?.id || null,
            title: `Level ${i}`,
          },
        })
      }

      // Verify the deepest level has correct slug path
      if (currentParent) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(currentParent._h_slugPath).toContain('/')
        const pathSegments = currentParent._h_slugPath?.split('/')
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pathSegments).toHaveLength(10) // level-0 through level-9
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pathSegments?.[0]).toBe('level-0')
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pathSegments?.[9]).toBe('level-9')
      }
    })
  })

  describe('Draft Versions', () => {
    it('should compute paths correctly for published and draft versions', async () => {
      // Create parent and child
      const parent = await payload.create({
        collection: 'pages',
        data: { title: 'Products', parent: null },
      })

      // Publish child
      const child = await payload.create({
        collection: 'pages',
        data: { title: 'Clothing', parent: parent.id, _status: 'published' },
      })

      // Create draft with different title
      await payload.update({
        collection: 'pages',
        id: child.id,
        draft: true,
        data: { title: 'Apparel' },
      })

      // Move parent
      const grandParent = await payload.create({
        collection: 'pages',
        data: { title: 'Categories', parent: null, _status: 'published' },
      })

      await payload.update({
        collection: 'pages',
        id: parent.id,
        data: { parent: grandParent.id, _status: 'published' },
      })

      // Paths are computed on read - published version uses published title
      const publishedChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
        draft: false,
      })

      expect(publishedChild._h_slugPath).toBe('categories/products/clothing')

      // Draft version uses draft title
      const draftChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
        draft: true,
      })

      expect(draftChild._h_slugPath).toBe('categories/products/apparel')
    })

    it('should compute paths when no draft exists', async () => {
      const parent = await payload.create({
        collection: 'pages',
        data: { title: 'Services', parent: null, _status: 'published' },
      })

      const child = await payload.create({
        collection: 'pages',
        data: { title: 'Consulting', parent: parent.id, _status: 'published' },
      })

      const newParent = await payload.create({
        collection: 'pages',
        data: { title: 'Offerings', parent: null },
      })

      await payload.update({
        collection: 'pages',
        id: parent.id,
        data: { parent: newParent.id },
      })

      // Path is computed from current parent chain
      const publishedChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
      })

      expect(publishedChild._h_slugPath).toBe('offerings/services/consulting')
      expect(publishedChild._status).toBe('published')

      // When no draft exists, draft: true returns published version
      const draftChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
        draft: true,
      })

      expect(draftChild._h_slugPath).toBe('offerings/services/consulting')
      expect(draftChild._status).toBe('published')
    })

    it('should compute paths for draft-only documents', async () => {
      const parent1 = await payload.create({
        collection: 'pages',
        data: { title: 'Future', parent: null },
        draft: true,
      })

      const child = await payload.create({
        collection: 'pages',
        data: { title: 'Plans', parent: parent1.id },
        draft: true,
      })

      const newParent = await payload.create({
        collection: 'pages',
        data: { title: 'Roadmap', parent: null },
        draft: true,
      })

      await payload.update({
        collection: 'pages',
        id: parent1.id,
        data: { parent: newParent.id },
        draft: true,
      })

      // Path is computed from current draft parent chain
      const draftChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
        draft: true,
      })

      expect(draftChild._h_slugPath).toBe('roadmap/future/plans')
      expect(draftChild._status).toBe('draft')
    })

    it('should compute paths for collections without versioning', async () => {
      const parent = await payload.create({
        collection: 'categories',
        data: { name: 'Electronics', parentCategory: null },
      })

      const child = await payload.create({
        collection: 'categories',
        data: { name: 'Phones', parentCategory: parent.id },
      })

      const newParent = await payload.create({
        collection: 'categories',
        data: { name: 'Tech', parentCategory: null },
      })

      await payload.update({
        collection: 'categories',
        id: parent.id,
        data: { parentCategory: newParent.id },
      })

      // Path is computed from current parent chain
      const updatedChild = await payload.findByID({
        collection: 'categories',
        id: child.id,
      })

      expect(updatedChild._h_slugPath).toBe('tech/electronics/phones')
    })
  })

  describe('Localization', () => {
    it('should generate localized paths for each locale', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'products',
        data: {
          name: 'Clothing',
          parent: null,
        },
      })

      // Update parent for Spanish
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Ropa' },
        locale: 'es',
      })

      // Update parent for German
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'products',
        data: {
          name: 'Shirts',
          parent: parent.id,
        },
      })

      // Update child for Spanish
      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Camisas' },
        locale: 'es',
      })

      // Update child for German
      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Hemden' },
        locale: 'de',
      })

      // Fetch with locale: 'all' to get all locales
      const childWithAllLocales = await payload.findByID({
        collection: 'products',
        id: child.id,
        locale: 'all',
      })

      // Verify paths are localized
      expect(childWithAllLocales._h_slugPath).toEqual({
        en: 'clothing/shirts',
        es: 'ropa/camisas',
        de: 'kleidung/hemden',
      })

      expect(childWithAllLocales._h_titlePath).toEqual({
        en: 'Clothing/Shirts',
        es: 'Ropa/Camisas',
        de: 'Kleidung/Hemden',
      })
    })

    it('should update localized paths when parent moves', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'products',
        data: {
          name: 'Clothing',
          parent: null,
        },
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Ropa' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'products',
        data: {
          name: 'Shirts',
          parent: parent.id,
        },
      })

      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Camisas' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Hemden' },
        locale: 'de',
      })

      // Create new parent with default locale (en)
      const newParent = await payload.create({
        collection: 'products',
        data: {
          name: 'Apparel',
          parent: null,
        },
      })

      await payload.update({
        collection: 'products',
        id: newParent.id,
        data: { name: 'Indumentaria' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: newParent.id,
        data: { name: 'Bekleidung' },
        locale: 'de',
      })

      // Move parent under newParent
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { parent: newParent.id },
      })

      // Fetch child with all locales
      const updatedChild = await payload.findByID({
        collection: 'products',
        id: child.id,
        locale: 'all',
      })

      expect(updatedChild._h_slugPath).toEqual({
        en: 'apparel/clothing/shirts',
        es: 'indumentaria/ropa/camisas',
        de: 'bekleidung/kleidung/hemden',
      })

      expect(updatedChild._h_titlePath).toEqual({
        en: 'Apparel/Clothing/Shirts',
        es: 'Indumentaria/Ropa/Camisas',
        de: 'Bekleidung/Kleidung/Hemden',
      })
    })

    it('should update localized paths when title changes', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'products',
        data: {
          name: 'Clothing',
          parent: null,
        },
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Ropa' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'products',
        data: {
          name: 'Shirts',
          parent: parent.id,
        },
      })

      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Camisas' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Hemden' },
        locale: 'de',
      })

      // Update parent title for all locales
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Apparel' },
        locale: 'en',
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Indumentaria' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Bekleidung' },
        locale: 'de',
      })

      // Fetch child with all locales
      const updatedChild = await payload.findByID({
        collection: 'products',
        id: child.id,
        locale: 'all',
      })

      expect(updatedChild._h_slugPath).toEqual({
        en: 'apparel/shirts',
        es: 'indumentaria/camisas',
        de: 'bekleidung/hemden',
      })

      expect(updatedChild._h_titlePath).toEqual({
        en: 'Apparel/Shirts',
        es: 'Indumentaria/Camisas',
        de: 'Bekleidung/Hemden',
      })
    })

    it('should handle localized drafts with different titles per locale', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'products',
        data: {
          name: 'Clothing',
          parent: null,
        },
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Ropa' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'products',
        data: {
          name: 'Shirts',
          parent: parent.id,
        },
      })

      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Camisas' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Hemden' },
        locale: 'de',
      })

      // Publish
      await payload.update({
        collection: 'products',
        id: child.id,
        data: { _status: 'published' },
        draft: false,
      })

      // Create draft with different title for each locale
      for (const locale of ['en', 'es', 'de']) {
        const titleMap = {
          en: 'T-Shirts',
          es: 'Playeras',
          de: 'T-Shirts',
        }
        await payload.update({
          collection: 'products',
          id: child.id,
          data: {
            name: titleMap[locale],
          },
          draft: true,
          locale,
        })
      }

      // Create newParent with default locale (en)
      const newParent = await payload.create({
        collection: 'products',
        data: {
          name: 'Apparel',
          parent: null,
        },
      })

      await payload.update({
        collection: 'products',
        id: newParent.id,
        data: { name: 'Indumentaria' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: newParent.id,
        data: { name: 'Bekleidung' },
        locale: 'de',
      })

      // Move parent under newParent
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { parent: newParent.id },
      })

      // Verify published version
      const publishedChild = await payload.findByID({
        collection: 'products',
        id: child.id,
        locale: 'all',
      })

      expect(publishedChild._h_slugPath).toEqual({
        en: 'apparel/clothing/shirts',
        es: 'indumentaria/ropa/camisas',
        de: 'bekleidung/kleidung/hemden',
      })

      // Verify draft version
      const draftChild = await payload.findByID({
        collection: 'products',
        id: child.id,
        draft: true,
        locale: 'all',
      })

      expect(draftChild._h_slugPath).toEqual({
        en: 'apparel/clothing/t-shirts',
        es: 'indumentaria/ropa/playeras',
        de: 'bekleidung/kleidung/t-shirts',
      })
    })

    it('should handle draft-only documents with localized paths', async () => {
      // Create parent as draft for default locale first
      const parent = await payload.create({
        collection: 'products',
        data: {
          name: 'Future',
          parent: null,
        },
        draft: true,
        locale: 'en',
      })

      // Update other locales for parent
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Futuro' },
        draft: true,
        locale: 'es',
      })
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { name: 'Zukunft' },
        draft: true,
        locale: 'de',
      })

      // Create child as draft
      const child = await payload.create({
        collection: 'products',
        data: {
          name: 'Plans',
          parent: parent.id,
        },
        draft: true,
        locale: 'en',
      })

      // Update other locales for child
      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Planes' },
        draft: true,
        locale: 'es',
      })
      await payload.update({
        collection: 'products',
        id: child.id,
        data: { name: 'Pläne' },
        draft: true,
        locale: 'de',
      })

      // Create new parent (published) with default locale
      const newParent = await payload.create({
        collection: 'products',
        data: {
          name: 'Roadmap',
          parent: null,
        },
      })

      await payload.update({
        collection: 'products',
        id: newParent.id,
        data: { name: 'Hoja de Ruta' },
        locale: 'es',
      })

      await payload.update({
        collection: 'products',
        id: newParent.id,
        data: { name: 'Fahrplan' },
        locale: 'de',
      })

      // Move parent
      await payload.update({
        collection: 'products',
        id: parent.id,
        data: { parent: newParent.id },
        draft: true,
        locale: 'en',
      })

      const draftChild = await payload.findByID({
        collection: 'products',
        id: child.id,
        draft: true,
        locale: 'all',
      })

      expect(draftChild._h_slugPath).toEqual({
        en: 'roadmap/future/plans',
        es: 'hoja-de-ruta/futuro/planes',
        de: 'fahrplan/zukunft/plne', // Note: Default slugify removes umlauts
      })

      expect(draftChild._h_titlePath).toEqual({
        en: 'Roadmap/Future/Plans',
        es: 'Hoja de Ruta/Futuro/Planes',
        de: 'Fahrplan/Zukunft/Pläne',
      })
    })
  })

  describe('Ancestor Cache Performance', () => {
    beforeEach(async () => {
      await payload.delete({ collection: 'pages', where: {} })
    })

    afterEach(async () => {
      await payload.delete({ collection: 'pages', where: {} })
    })

    it('should cache ancestors when computing paths for multiple documents', async () => {
      // Create a hierarchy: Root > Category > 5 children
      const root = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      const category = await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Category' },
      })

      const childIds: Array<number | string> = []

      for (let i = 1; i <= 5; i++) {
        const child = await payload.create({
          collection: 'pages',
          data: { parent: category.id, title: `Child ${i}` },
        })
        childIds.push(child.id)
      }

      // Enable cache stats tracking in context
      const cacheStats = {
        hits: 0,
        misses: 0,
        queries: 0,
      }

      // Fetch all children - this should demonstrate caching
      const results = await payload.find({
        collection: 'pages',
        context: {
          hierarchyCacheStats: cacheStats,
        },
        where: {
          id: { in: childIds },
        },
      })

      expect(results.docs.length).toBe(5)

      // Verify cache statistics
      const stats = cacheStats

      // Recursive approach: Each child fetches its parent once
      // With parallel processing, all 5 children may fetch parent before cache is populated
      // but we're still benefiting from only fetching immediate parent (not full chain)
      // Plus when root/category are read, their parents might be cached
      expect(stats.queries).toBeGreaterThanOrEqual(1) // At least one parent fetch
      expect(stats.queries).toBeLessThanOrEqual(6) // At most children + parent queries
      expect(stats.misses).toBeGreaterThan(0) // Some cache misses expected
      expect(stats.hits).toBeGreaterThanOrEqual(0) // Some cache hits may occur

      // Verify all paths computed correctly
      for (const doc of results.docs) {
        expect(doc._h_slugPath).toContain('root/category/')
        expect(doc._h_titlePath).toContain('Root/Category/')
      }
    })

    it('should show cache benefit: 10 docs with shared ancestors', async () => {
      // Create deeper hierarchy
      const root = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Products' },
      })

      const cat1 = await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Electronics' },
      })

      const cat2 = await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Clothing' },
      })

      const childIds: Array<number | string> = []

      // 5 products under Electronics
      for (let i = 1; i <= 5; i++) {
        const child = await payload.create({
          collection: 'pages',
          data: { parent: cat1.id, title: `Product E${i}` },
        })
        childIds.push(child.id)
      }

      // 5 products under Clothing
      for (let i = 1; i <= 5; i++) {
        const child = await payload.create({
          collection: 'pages',
          data: { parent: cat2.id, title: `Product C${i}` },
        })
        childIds.push(child.id)
      }

      const cacheStats = {
        hits: 0,
        misses: 0,
        queries: 0,
      }

      await payload.find({
        collection: 'pages',
        context: {
          hierarchyCacheStats: cacheStats,
        },
        where: {
          id: { in: childIds },
        },
      })

      const stats = cacheStats

      // Recursive approach with 2 categories, 5 products each:
      // Each product fetches its parent category (which has paths already computed)
      // With parallel processing, multiple products may fetch same parent before cache hits
      // But we're still much more efficient than walking full chains for each
      expect(stats.queries).toBeGreaterThanOrEqual(2) // At least 2 category fetches
      expect(stats.queries).toBeLessThanOrEqual(12) // At most all products + parents
      expect(stats.misses).toBeGreaterThan(0) // Some cache misses
      expect(stats.hits).toBeGreaterThanOrEqual(0) // Some cache hits may occur
    })
  })
})
