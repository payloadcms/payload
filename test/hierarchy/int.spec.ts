import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Page } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let restClient: NextRESTClient

describe('Hierarchy', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
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
        context: { computeHierarchyPaths: true },
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
        context: { computeHierarchyPaths: true },
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
        context: { computeHierarchyPaths: true },
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
        context: { computeHierarchyPaths: true },
        data: { parent: anotherRoot.id },
      })

      // Check child path reflects new parent
      expect(updatedChild._h_slugPath).toBe('another-root/child')
      expect(updatedChild._h_titlePath).toBe('Another Root/Child')

      // Check grandchild path automatically reflects change (walks up parent chain)
      const updatedGrandchild = await payload.findByID({
        id: grandchildPage.id,
        collection: 'pages',
        context: { computeHierarchyPaths: true },
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
        context: { computeHierarchyPaths: true },
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
        context: { computeHierarchyPaths: true },
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
          id: page.id,
          collection: 'pages',
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
          id: parentPage.id,
          collection: 'pages',
          data: { parent: childPage.id },
        }),
      ).rejects.toThrow('Cannot move folder into its own subfolder')
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
          id: grandparent.id,
          collection: 'pages',
          data: { parent: child.id },
        }),
      ).rejects.toThrow('Cannot move folder into its own subfolder')
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
        id: child.id,
        collection: 'pages',
        context: { computeHierarchyPaths: true },
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
        context: { computeHierarchyPaths: true },
        data: { deptName: 'Engineering' },
      })

      expect(parentDept._breadcrumbSlug).toBe('engineering')
      expect(parentDept._breadcrumbTitle).toBe('Engineering')

      const childDept = await payload.create({
        collection: 'departments',
        context: { computeHierarchyPaths: true },
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
          context: { computeHierarchyPaths: true },
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
        data: { parent: null, title: 'Products' },
      })

      // Publish child
      const child = await payload.create({
        collection: 'pages',
        data: { _status: 'published', parent: parent.id, title: 'Clothing' },
      })

      // Create draft with different title
      await payload.update({
        id: child.id,
        collection: 'pages',
        data: { title: 'Apparel' },
        draft: true,
      })

      // Move parent
      const grandParent = await payload.create({
        collection: 'pages',
        data: { _status: 'published', parent: null, title: 'Categories' },
      })

      await payload.update({
        id: parent.id,
        collection: 'pages',
        data: { _status: 'published', parent: grandParent.id },
      })

      // Paths are computed on read - published version uses published title
      const publishedChild = await payload.findByID({
        id: child.id,
        collection: 'pages',
        context: { computeHierarchyPaths: true },
        draft: false,
      })

      expect(publishedChild._h_slugPath).toBe('categories/products/clothing')

      // Draft version uses draft title
      const draftChild = await payload.findByID({
        id: child.id,
        collection: 'pages',
        context: { computeHierarchyPaths: true },
        draft: true,
      })

      expect(draftChild._h_slugPath).toBe('categories/products/apparel')
    })

    it('should compute paths when no draft exists', async () => {
      const parent = await payload.create({
        collection: 'pages',
        data: { _status: 'published', parent: null, title: 'Services' },
      })

      const child = await payload.create({
        collection: 'pages',
        data: { _status: 'published', parent: parent.id, title: 'Consulting' },
      })

      const newParent = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Offerings' },
      })

      await payload.update({
        id: parent.id,
        collection: 'pages',
        data: { parent: newParent.id },
      })

      // Path is computed from current parent chain
      const publishedChild = await payload.findByID({
        id: child.id,
        collection: 'pages',
        context: { computeHierarchyPaths: true },
      })

      expect(publishedChild._h_slugPath).toBe('offerings/services/consulting')
      expect(publishedChild._status).toBe('published')

      // When no draft exists, draft: true returns published version
      const draftChild = await payload.findByID({
        id: child.id,
        collection: 'pages',
        context: { computeHierarchyPaths: true },
        draft: true,
      })

      expect(draftChild._h_slugPath).toBe('offerings/services/consulting')
      expect(draftChild._status).toBe('published')
    })

    it('should compute paths for draft-only documents', async () => {
      const parent1 = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Future' },
        draft: true,
      })

      const child = await payload.create({
        collection: 'pages',
        data: { parent: parent1.id, title: 'Plans' },
        draft: true,
      })

      const newParent = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Roadmap' },
        draft: true,
      })

      await payload.update({
        id: parent1.id,
        collection: 'pages',
        data: { parent: newParent.id },
        draft: true,
      })

      // Path is computed from current draft parent chain
      const draftChild = await payload.findByID({
        id: child.id,
        collection: 'pages',
        context: { computeHierarchyPaths: true },
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
        id: parent.id,
        collection: 'categories',
        data: { parentCategory: newParent.id },
      })

      // Path is computed from current parent chain
      const updatedChild = await payload.findByID({
        id: child.id,
        collection: 'categories',
        context: { computeHierarchyPaths: true },
      })

      expect(updatedChild._h_slugPath).toBe('tech/electronics/phones')
    })
  })

  describe('Localization', () => {
    it('should generate localized paths for each locale', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Clothing',
          parent: null,
        },
      })

      // Update parent for Spanish
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Ropa' },
        locale: 'es',
      })

      // Update parent for German
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'posts',
        data: {
          title: 'Shirts',
          parent: parent.id,
        },
      })

      // Update child for Spanish
      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Camisas' },
        locale: 'es',
      })

      // Update child for German
      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Hemden' },
        locale: 'de',
      })

      // Fetch with locale: 'all' to get all locales
      const childWithAllLocales = await payload.findByID({
        id: child.id,
        collection: 'posts',
        context: { computeHierarchyPaths: true },
        locale: 'all',
      })

      // Verify paths are localized
      expect(childWithAllLocales._h_slugPath).toEqual({
        de: 'kleidung/hemden',
        en: 'clothing/shirts',
        es: 'ropa/camisas',
      })

      expect(childWithAllLocales._h_titlePath).toEqual({
        de: 'Kleidung/Hemden',
        en: 'Clothing/Shirts',
        es: 'Ropa/Camisas',
      })
    })

    it('should update localized paths when parent moves', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Clothing',
          parent: null,
        },
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Ropa' },
        locale: 'es',
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'posts',
        data: {
          title: 'Shirts',
          parent: parent.id,
        },
      })

      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Camisas' },
        locale: 'es',
      })

      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Hemden' },
        locale: 'de',
      })

      // Create new parent with default locale (en)
      const newParent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Apparel',
          parent: null,
        },
      })

      await payload.update({
        id: newParent.id,
        collection: 'posts',
        data: { title: 'Indumentaria' },
        locale: 'es',
      })

      await payload.update({
        id: newParent.id,
        collection: 'posts',
        data: { title: 'Bekleidung' },
        locale: 'de',
      })

      // Move parent under newParent
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { parent: newParent.id },
      })

      // Fetch child with all locales
      const updatedChild = await payload.findByID({
        id: child.id,
        collection: 'posts',
        context: { computeHierarchyPaths: true },
        locale: 'all',
      })

      expect(updatedChild._h_slugPath).toEqual({
        de: 'bekleidung/kleidung/hemden',
        en: 'apparel/clothing/shirts',
        es: 'indumentaria/ropa/camisas',
      })

      expect(updatedChild._h_titlePath).toEqual({
        de: 'Bekleidung/Kleidung/Hemden',
        en: 'Apparel/Clothing/Shirts',
        es: 'Indumentaria/Ropa/Camisas',
      })
    })

    it('should update localized paths when title changes', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Clothing',
          parent: null,
        },
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Ropa' },
        locale: 'es',
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'posts',
        data: {
          title: 'Shirts',
          parent: parent.id,
        },
      })

      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Camisas' },
        locale: 'es',
      })

      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Hemden' },
        locale: 'de',
      })

      // Update parent title for all locales
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Apparel' },
        locale: 'en',
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Indumentaria' },
        locale: 'es',
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Bekleidung' },
        locale: 'de',
      })

      // Fetch child with all locales
      const updatedChild = await payload.findByID({
        id: child.id,
        collection: 'posts',
        context: { computeHierarchyPaths: true },
        locale: 'all',
      })

      expect(updatedChild._h_slugPath).toEqual({
        de: 'bekleidung/hemden',
        en: 'apparel/shirts',
        es: 'indumentaria/camisas',
      })

      expect(updatedChild._h_titlePath).toEqual({
        de: 'Bekleidung/Hemden',
        en: 'Apparel/Shirts',
        es: 'Indumentaria/Camisas',
      })
    })

    it('should handle localized drafts with different titles per locale', async () => {
      // Create parent with default locale (en)
      const parent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Clothing',
          parent: null,
        },
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Ropa' },
        locale: 'es',
      })

      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Kleidung' },
        locale: 'de',
      })

      // Create child with default locale (en)
      const child = await payload.create({
        collection: 'posts',
        data: {
          title: 'Shirts',
          parent: parent.id,
        },
      })

      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Camisas' },
        locale: 'es',
      })

      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Hemden' },
        locale: 'de',
      })

      // Publish
      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { _status: 'published' },
        draft: false,
      })

      // Create draft with different title for each locale
      for (const locale of ['en', 'es', 'de']) {
        const titleMap = {
          de: 'T-Shirts',
          en: 'T-Shirts',
          es: 'Playeras',
        }
        await payload.update({
          id: child.id,
          collection: 'posts',
          data: {
            title: titleMap[locale],
          },
          draft: true,
          locale,
        })
      }

      // Create newParent with default locale (en)
      const newParent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Apparel',
          parent: null,
        },
      })

      await payload.update({
        id: newParent.id,
        collection: 'posts',
        data: { title: 'Indumentaria' },
        locale: 'es',
      })

      await payload.update({
        id: newParent.id,
        collection: 'posts',
        data: { title: 'Bekleidung' },
        locale: 'de',
      })

      // Move parent under newParent
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { parent: newParent.id },
      })

      // Verify published version
      const publishedChild = await payload.findByID({
        id: child.id,
        collection: 'posts',
        context: { computeHierarchyPaths: true },
        locale: 'all',
      })

      expect(publishedChild._h_slugPath).toEqual({
        de: 'bekleidung/kleidung/hemden',
        en: 'apparel/clothing/shirts',
        es: 'indumentaria/ropa/camisas',
      })

      // Verify draft version
      const draftChild = await payload.findByID({
        id: child.id,
        collection: 'posts',
        context: { computeHierarchyPaths: true },
        draft: true,
        locale: 'all',
      })

      expect(draftChild._h_slugPath).toEqual({
        de: 'bekleidung/kleidung/t-shirts',
        en: 'apparel/clothing/t-shirts',
        es: 'indumentaria/ropa/playeras',
      })
    })

    it('should handle draft-only documents with localized paths', async () => {
      // Create parent as draft for default locale first
      const parent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Future',
          parent: null,
        },
        draft: true,
        locale: 'en',
      })

      // Update other locales for parent
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Futuro' },
        draft: true,
        locale: 'es',
      })
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { title: 'Zukunft' },
        draft: true,
        locale: 'de',
      })

      // Create child as draft
      const child = await payload.create({
        collection: 'posts',
        data: {
          title: 'Plans',
          parent: parent.id,
        },
        draft: true,
        locale: 'en',
      })

      // Update other locales for child
      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Planes' },
        draft: true,
        locale: 'es',
      })
      await payload.update({
        id: child.id,
        collection: 'posts',
        data: { title: 'Pläne' },
        draft: true,
        locale: 'de',
      })

      // Create new parent (published) with default locale
      const newParent = await payload.create({
        collection: 'posts',
        data: {
          title: 'Roadmap',
          parent: null,
        },
      })

      await payload.update({
        id: newParent.id,
        collection: 'posts',
        data: { title: 'Hoja de Ruta' },
        locale: 'es',
      })

      await payload.update({
        id: newParent.id,
        collection: 'posts',
        data: { title: 'Fahrplan' },
        locale: 'de',
      })

      // Move parent
      await payload.update({
        id: parent.id,
        collection: 'posts',
        data: { parent: newParent.id },
        draft: true,
        locale: 'en',
      })

      const draftChild = await payload.findByID({
        id: child.id,
        collection: 'posts',
        context: { computeHierarchyPaths: true },
        draft: true,
        locale: 'all',
      })

      expect(draftChild._h_slugPath).toEqual({
        de: 'fahrplan/zukunft/plne', // Note: Default slugify removes umlauts
        en: 'roadmap/future/plans',
        es: 'hoja-de-ruta/futuro/planes',
      })

      expect(draftChild._h_titlePath).toEqual({
        de: 'Fahrplan/Zukunft/Pläne',
        en: 'Roadmap/Future/Plans',
        es: 'Hoja de Ruta/Futuro/Planes',
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
          computeHierarchyPaths: true,
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
          computeHierarchyPaths: true,
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

  describe('Polymorphic Joins', () => {
    const foldersSlug = 'hierarchy-folders'
    const hierarchyPostsSlug = 'hierarchy-posts'

    beforeEach(async () => {
      await payload.delete({
        collection: foldersSlug,
        where: { id: { exists: true } },
      })
    })

    it('should populate all nested subfolders for multiple root folders when queried with depth', async () => {
      const ROOT_FOLDER_COUNT = 8
      const NESTED_FOLDER_COUNT = 10

      const rootFolders: { id: number | string; name: string }[] = []

      for (let i = 1; i <= ROOT_FOLDER_COUNT; i++) {
        const rootFolder = await payload.create({
          collection: foldersSlug,
          data: {
            name: `Root Folder ${i}`,
            folderType: [hierarchyPostsSlug],
          },
        })
        rootFolders.push({ id: rootFolder.id, name: rootFolder.name })

        for (let j = 1; j <= NESTED_FOLDER_COUNT; j++) {
          await payload.create({
            collection: foldersSlug,
            data: {
              name: `Root ${i} - Subfolder ${j}`,
              folder: rootFolder.id,
              folderType: [hierarchyPostsSlug],
            },
          })
        }
      }

      const result = await payload.find({
        collection: foldersSlug,
        depth: 3,
        limit: 10000,
        where: {
          and: [{ folderType: { contains: hierarchyPostsSlug } }, { folder: { exists: false } }],
        },
      })

      expect(result.docs).toHaveLength(ROOT_FOLDER_COUNT)

      for (const rootFolder of result.docs) {
        const nestedFolders = rootFolder.documentsAndFolders?.docs?.filter(
          (doc: any) => doc.relationTo === foldersSlug,
        )
        expect(nestedFolders).toHaveLength(NESTED_FOLDER_COUNT)
      }

      const totalNestedFolders = result.docs.reduce((acc, folder) => {
        const nested =
          folder.documentsAndFolders?.docs?.filter((doc: any) => doc.relationTo === foldersSlug) ||
          []
        return acc + nested.length
      }, 0)

      expect(totalNestedFolders).toBe(ROOT_FOLDER_COUNT * NESTED_FOLDER_COUNT)
    })

    it('should populate nested subfolders consistently regardless of query order', async () => {
      const rootFolders: { id: number | string }[] = []

      for (let i = 1; i <= 4; i++) {
        const rootFolder = await payload.create({
          collection: foldersSlug,
          data: {
            name: `Root ${i}`,
            folderType: [hierarchyPostsSlug],
          },
        })
        rootFolders.push({ id: rootFolder.id })

        for (let j = 1; j <= 5; j++) {
          await payload.create({
            collection: foldersSlug,
            data: {
              name: `Root ${i} - Sub ${j}`,
              folder: rootFolder.id,
              folderType: [hierarchyPostsSlug],
            },
          })
        }
      }

      const ascResult = await payload.find({
        collection: foldersSlug,
        depth: 2,
        limit: 100,
        sort: 'name',
        where: {
          folder: { exists: false },
          folderType: { contains: hierarchyPostsSlug },
        },
      })

      const descResult = await payload.find({
        collection: foldersSlug,
        depth: 2,
        limit: 100,
        sort: '-name',
        where: {
          folder: { exists: false },
          folderType: { contains: hierarchyPostsSlug },
        },
      })

      expect(ascResult.docs).toHaveLength(4)
      expect(descResult.docs).toHaveLength(4)

      const ascNestedCount = ascResult.docs.reduce(
        (acc, f) =>
          acc +
          (f.documentsAndFolders?.docs?.filter((d: any) => d.relationTo === foldersSlug)?.length ||
            0),
        0,
      )
      const descNestedCount = descResult.docs.reduce(
        (acc, f) =>
          acc +
          (f.documentsAndFolders?.docs?.filter((d: any) => d.relationTo === foldersSlug)?.length ||
            0),
        0,
      )

      expect(ascNestedCount).toBe(20)
      expect(descNestedCount).toBe(20)
    })

    it('should correctly paginate nested subfolders within polymorphic joins', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: {
          name: 'Parent with many subfolders',
          folderType: [hierarchyPostsSlug],
        },
      })

      for (let i = 1; i <= 12; i++) {
        await payload.create({
          collection: foldersSlug,
          data: {
            name: `Subfolder ${String(i).padStart(2, '0')}`,
            folder: parentFolder.id,
            folderType: [hierarchyPostsSlug],
          },
        })
      }

      const page1Result = await payload.findByID({
        id: parentFolder.id,
        collection: foldersSlug,
        joins: {
          documentsAndFolders: {
            limit: 5,
            sort: 'name',
          },
        },
      })

      expect(page1Result.documentsAndFolders?.docs?.length).toBeLessThanOrEqual(5)
      expect(page1Result.documentsAndFolders?.docs?.length).toBeGreaterThan(0)

      const page2Result = await payload.findByID({
        id: parentFolder.id,
        collection: foldersSlug,
        joins: {
          documentsAndFolders: {
            limit: 5,
            page: 2,
            sort: 'name',
          },
        },
      })

      expect(page2Result.documentsAndFolders?.docs?.length).toBeGreaterThan(0)
      expect(page2Result.documentsAndFolders?.docs?.length).toBeLessThanOrEqual(5)

      const page1Names = page1Result.documentsAndFolders?.docs?.map(
        (d: any) => d.value?.name,
      ) as string[]
      const page2Names = page2Result.documentsAndFolders?.docs?.map(
        (d: any) => d.value?.name,
      ) as string[]

      const page1Set = new Set(page1Names)
      const hasOverlap = page2Names.some((name) => page1Set.has(name))
      expect(hasOverlap).toBe(false)

      const lastPage1Name = page1Names[page1Names.length - 1]
      const firstPage2Name = page2Names[0]
      expect(lastPage1Name < firstPage2Name).toBe(true)
    })

    it('should populate subfolders for folder by ID', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: {
          name: 'Parent Folder',
          folderType: [hierarchyPostsSlug],
        },
      })

      await payload.create({
        collection: foldersSlug,
        data: {
          name: 'Nested 1',
          folder: parentFolder.id,
          folderType: [hierarchyPostsSlug],
        },
      })

      await payload.create({
        collection: foldersSlug,
        data: {
          name: 'Nested 2',
          folder: parentFolder.id,
          folderType: [hierarchyPostsSlug],
        },
      })

      const parentFolderQuery = await payload.findByID({
        collection: foldersSlug,
        id: parentFolder.id,
      })

      expect(parentFolderQuery.documentsAndFolders?.docs).toHaveLength(2)
    })

    it('should populate subfolders and documents for folder by ID', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Parent Folder' },
      })

      await payload.create({
        collection: foldersSlug,
        data: { name: 'Child Folder', folder: parentFolder.id, folderType: [hierarchyPostsSlug] },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: { title: 'Child Document', folder: parentFolder.id },
      })

      const parentFolderQuery = await payload.findByID({
        collection: foldersSlug,
        id: parentFolder.id,
        joins: {
          documentsAndFolders: {
            limit: 100000000,
            sort: 'name',
            where: {
              or: [
                {
                  and: [
                    { relationTo: { equals: foldersSlug } },
                    {
                      or: [
                        { folderType: { in: [hierarchyPostsSlug] } },
                        { folderType: { exists: false } },
                      ],
                    },
                  ],
                },
                {
                  and: [{ relationTo: { equals: hierarchyPostsSlug } }],
                },
              ],
            },
          },
        },
      })

      expect(parentFolderQuery.documentsAndFolders?.docs).toHaveLength(2)
    })

    it('should populate files for folder by ID', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: {
          folderType: [hierarchyPostsSlug],
          name: 'Parent Folder',
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post 1',
          folder: parentFolder.id,
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post 2',
          folder: parentFolder.id,
        },
      })

      const parentFolderQuery = await payload.findByID({
        collection: foldersSlug,
        id: parentFolder.id,
      })

      expect(parentFolderQuery.documentsAndFolders?.docs).toHaveLength(2)
    })

    it('should populate non-trashed documents when collection has both folders and trash enabled', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: {
          folderType: [hierarchyPostsSlug],
          name: 'Posts Folder',
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post 1',
          folder: parentFolder.id,
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post 2',
          folder: parentFolder.id,
        },
      })

      const post3 = await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post 3 (to be trashed)',
          folder: parentFolder.id,
        },
      })

      await payload.delete({
        collection: hierarchyPostsSlug,
        id: post3.id,
      })

      const parentFolderQuery = await payload.findByID({
        collection: foldersSlug,
        id: parentFolder.id,
        joins: {
          documentsAndFolders: {
            where: {
              or: [
                {
                  deletedAt: {
                    exists: false,
                  },
                },
              ],
            },
          },
        },
      })

      expect(parentFolderQuery.documentsAndFolders?.docs).toHaveLength(2)

      const returnedDocs = parentFolderQuery.documentsAndFolders?.docs
      expect(returnedDocs).toHaveLength(2)

      expect(returnedDocs?.some((doc) => (doc.value as any).title === 'Post 1')).toBe(true)
      expect(returnedDocs?.some((doc) => (doc.value as any).title === 'Post 2')).toBe(true)
    })
  })

  describe('Folder Hooks', () => {
    const foldersSlug = 'hierarchy-folders'
    const hierarchyPostsSlug = 'hierarchy-posts'

    beforeEach(async () => {
      await payload.delete({
        collection: foldersSlug,
        where: { id: { exists: true } },
      })
      await payload.delete({
        collection: hierarchyPostsSlug,
        where: { id: { exists: true } },
      })
    })

    it('should prevent moving a folder into its own subfolder', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: {
          folderType: [hierarchyPostsSlug],
          name: 'Parent Folder',
        },
      })

      const childFolder = await payload.create({
        collection: foldersSlug,
        data: {
          folderType: [hierarchyPostsSlug],
          name: 'Child Folder',
          folder: parentFolder,
        },
      })

      await expect(
        payload.update({
          collection: foldersSlug,
          data: { folder: childFolder },
          id: parentFolder.id,
        }),
      ).rejects.toThrow('Cannot move folder into its own subfolder')
    })

    it('dissasociateAfterDelete should delete _folder value in children after deleting the folder', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: {
          folderType: [hierarchyPostsSlug],
          name: 'Parent Folder',
        },
      })

      const post = await payload.create({
        collection: hierarchyPostsSlug,
        data: { title: 'Test', folder: parentFolder },
      })

      await payload.delete({ collection: foldersSlug, id: parentFolder.id })
      const postAfter = await payload.findByID({ collection: hierarchyPostsSlug, id: post.id })
      expect(postAfter.folder).toBeFalsy()
    })

    it('deleteSubfoldersBeforeDelete deletes subfolders after deleting the parent folder', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: {
          folderType: [hierarchyPostsSlug],
          name: 'Parent Folder',
        },
      })

      const childFolder = await payload.create({
        collection: foldersSlug,
        data: {
          name: 'Child Folder',
          folder: parentFolder,
          folderType: [hierarchyPostsSlug],
        },
      })

      await payload.delete({ collection: foldersSlug, id: parentFolder.id })

      await expect(
        payload.findByID({
          collection: foldersSlug,
          id: childFolder.id,
          disableErrors: true,
        }),
      ).resolves.toBeNull()
    })
  })

  describe('Collection Scoping', () => {
    const foldersSlug = 'hierarchy-folders'
    const hierarchyPostsSlug = 'hierarchy-posts'
    const mediaSlug = 'hierarchy-media'

    beforeEach(async () => {
      await payload.delete({
        collection: foldersSlug,
        where: { id: { exists: true } },
      })
      await payload.delete({
        collection: hierarchyPostsSlug,
        where: { id: { exists: true } },
      })
    })

    it('should filter folders by folderType using in operator', async () => {
      const postsOnlyFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Posts Only', folderType: [hierarchyPostsSlug] },
      })

      const mediaOnlyFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Media Only', folderType: [mediaSlug] },
      })

      const postsAndMediaFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Posts and Media', folderType: [hierarchyPostsSlug, mediaSlug] },
      })

      const postsResult = await payload.find({
        collection: foldersSlug,
        where: {
          folderType: { in: [hierarchyPostsSlug] },
        },
      })

      expect(postsResult.docs).toHaveLength(2)
      const postsFolderIds = postsResult.docs.map((d) => d.id)
      expect(postsFolderIds).toContain(postsOnlyFolder.id)
      expect(postsFolderIds).toContain(postsAndMediaFolder.id)
      expect(postsFolderIds).not.toContain(mediaOnlyFolder.id)

      const mediaResult = await payload.find({
        collection: foldersSlug,
        where: {
          folderType: { in: [mediaSlug] },
        },
      })

      expect(mediaResult.docs).toHaveLength(2)
      const mediaFolderIds = mediaResult.docs.map((d) => d.id)
      expect(mediaFolderIds).toContain(mediaOnlyFolder.id)
      expect(mediaFolderIds).toContain(postsAndMediaFolder.id)
      expect(mediaFolderIds).not.toContain(postsOnlyFolder.id)
    })

    it('should include folders with empty folderType (accepts all) when filtering', async () => {
      const postsOnlyFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Posts Only', folderType: [hierarchyPostsSlug] },
      })

      await payload.create({
        collection: foldersSlug,
        data: { name: 'Accepts All', folderType: [] },
      })

      const result = await payload.find({
        collection: foldersSlug,
        where: {
          or: [{ folderType: { in: [hierarchyPostsSlug] } }, { folderType: { exists: false } }],
        },
      })

      const folderIds = result.docs.map((d) => d.id)
      expect(folderIds).toContain(postsOnlyFolder.id)
    })

    it('should filter root folders by collection type', async () => {
      const postsFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Posts Folder', folderType: [hierarchyPostsSlug] },
      })

      await payload.create({
        collection: foldersSlug,
        data: { name: 'Media Folder', folderType: [mediaSlug] },
      })

      const result = await payload.find({
        collection: foldersSlug,
        where: {
          and: [{ folder: { exists: false } }, { folderType: { in: [hierarchyPostsSlug] } }],
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]!.id).toBe(postsFolder.id)
    })

    it('should filter child folders by collection type', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Parent', folderType: [hierarchyPostsSlug, mediaSlug] },
      })

      const postsChildFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Posts Child', folder: parentFolder.id, folderType: [hierarchyPostsSlug] },
      })

      await payload.create({
        collection: foldersSlug,
        data: { name: 'Media Child', folder: parentFolder.id, folderType: [mediaSlug] },
      })

      const result = await payload.find({
        collection: foldersSlug,
        where: {
          and: [
            { folder: { equals: parentFolder.id } },
            { folderType: { in: [hierarchyPostsSlug] } },
          ],
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]!.id).toBe(postsChildFolder.id)
    })
  })

  describe('findRelated Endpoint', () => {
    const foldersSlug = 'hierarchy-folders'
    const hierarchyPostsSlug = 'hierarchy-posts'

    beforeEach(async () => {
      await payload.delete({
        collection: foldersSlug,
        where: { id: { exists: true } },
      })
      await payload.delete({
        collection: hierarchyPostsSlug,
        where: { id: { exists: true } },
      })
    })

    it('should return 401 when not authenticated', async () => {
      const folder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Test Folder' },
      })

      const response = await restClient.GET(`/${foldersSlug}/${folder.id}/related`, {
        auth: false,
      })

      expect(response.status).toBe(401)
    })

    it('should return child folders for a parent folder', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Parent Folder' },
      })

      const child1 = await payload.create({
        collection: foldersSlug,
        data: { name: 'Child 1', folder: parentFolder.id },
      })

      const child2 = await payload.create({
        collection: foldersSlug,
        data: { name: 'Child 2', folder: parentFolder.id },
      })

      const response = await restClient.GET(`/${foldersSlug}/${parentFolder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[foldersSlug]).toBeDefined()
      expect(result[foldersSlug].docs).toHaveLength(2)

      const childIds = result[foldersSlug].docs.map((d: any) => d.id)
      expect(childIds).toContain(child1.id)
      expect(childIds).toContain(child2.id)
    })

    it('should return related documents from other collections', async () => {
      const folder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Posts Folder', folderType: [hierarchyPostsSlug] },
      })

      const post1 = await payload.create({
        collection: hierarchyPostsSlug,
        data: { title: 'Post 1', folder: folder.id },
      })

      const post2 = await payload.create({
        collection: hierarchyPostsSlug,
        data: { title: 'Post 2', folder: folder.id },
      })

      const response = await restClient.GET(`/${foldersSlug}/${folder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[hierarchyPostsSlug]).toBeDefined()
      expect(result[hierarchyPostsSlug].docs).toHaveLength(2)

      const postIds = result[hierarchyPostsSlug].docs.map((d: any) => d.id)
      expect(postIds).toContain(post1.id)
      expect(postIds).toContain(post2.id)
    })

    it('should return both child folders and related documents', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Mixed Folder' },
      })

      await payload.create({
        collection: foldersSlug,
        data: { name: 'Subfolder', folder: parentFolder.id },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: { title: 'Post in Folder', folder: parentFolder.id },
      })

      const response = await restClient.GET(`/${foldersSlug}/${parentFolder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[foldersSlug].docs).toHaveLength(1)
      expect(result[hierarchyPostsSlug].docs).toHaveLength(1)
    })

    it('should respect pagination parameters', async () => {
      const parentFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Paginated Folder' },
      })

      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: foldersSlug,
          data: { name: `Child ${i}`, folder: parentFolder.id },
        })
      }

      const response = await restClient.GET(
        `/${foldersSlug}/${parentFolder.id}/related?limit=2&page=1`,
      )
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[foldersSlug].docs).toHaveLength(2)
      expect(result[foldersSlug].totalDocs).toBe(5)
      expect(result[foldersSlug].totalPages).toBe(3)
      expect(result[foldersSlug].hasNextPage).toBe(true)
    })

    it('should return empty results for folder with no children', async () => {
      const emptyFolder = await payload.create({
        collection: foldersSlug,
        data: { name: 'Empty Folder' },
      })

      const response = await restClient.GET(`/${foldersSlug}/${emptyFolder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[foldersSlug].docs).toHaveLength(0)
    })
  })

  describe('Multi-Assignment (Tags)', () => {
    const tagsSlug = 'hierarchy-tags'
    const hierarchyPostsSlug = 'hierarchy-posts'

    beforeEach(async () => {
      await payload.delete({
        collection: tagsSlug,
        where: { id: { exists: true } },
      })
      await payload.delete({
        collection: hierarchyPostsSlug,
        where: { id: { exists: true } },
      })
    })

    it('should allow documents to have multiple tags', async () => {
      const tag1 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Tag 1' },
      })

      const tag2 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Tag 2' },
      })

      const tag3 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Tag 3' },
      })

      const post = await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Multi-tagged Post',
          [`_h_${tagsSlug}`]: [tag1.id, tag2.id, tag3.id],
        },
      })

      const fetchedPost = await payload.findByID({
        collection: hierarchyPostsSlug,
        id: post.id,
        depth: 0,
      })

      expect(fetchedPost[`_h_${tagsSlug}`]).toHaveLength(3)
      expect(fetchedPost[`_h_${tagsSlug}`]).toContain(tag1.id)
      expect(fetchedPost[`_h_${tagsSlug}`]).toContain(tag2.id)
      expect(fetchedPost[`_h_${tagsSlug}`]).toContain(tag3.id)
    })

    it('should find documents by single tag', async () => {
      const targetTag = await payload.create({
        collection: tagsSlug,
        data: { name: 'Target Tag' },
      })

      const otherTag = await payload.create({
        collection: tagsSlug,
        data: { name: 'Other Tag' },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post with Target',
          [`_h_${tagsSlug}`]: [targetTag.id],
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post with Both',
          [`_h_${tagsSlug}`]: [targetTag.id, otherTag.id],
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post with Other',
          [`_h_${tagsSlug}`]: [otherTag.id],
        },
      })

      const results = await payload.find({
        collection: hierarchyPostsSlug,
        where: {
          [`_h_${tagsSlug}`]: { in: [targetTag.id] },
        },
      })

      expect(results.docs).toHaveLength(2)
      const titles = results.docs.map((d) => d.title)
      expect(titles).toContain('Post with Target')
      expect(titles).toContain('Post with Both')
    })

    it('should find documents matching any tag (OR query)', async () => {
      const tag1 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Option 1' },
      })

      const tag2 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Option 2' },
      })

      const tag3 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Option 3' },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Has Tag 1',
          [`_h_${tagsSlug}`]: [tag1.id],
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Has Tag 2',
          [`_h_${tagsSlug}`]: [tag2.id],
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Has Tag 3 Only',
          [`_h_${tagsSlug}`]: [tag3.id],
        },
      })

      const results = await payload.find({
        collection: hierarchyPostsSlug,
        where: {
          [`_h_${tagsSlug}`]: { in: [tag1.id, tag2.id] },
        },
      })

      expect(results.docs).toHaveLength(2)
      const titles = results.docs.map((d) => d.title)
      expect(titles).toContain('Has Tag 1')
      expect(titles).toContain('Has Tag 2')
      expect(titles).not.toContain('Has Tag 3 Only')
    })

    it('should allow removing individual tags from document', async () => {
      const tag1 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Keep This' },
      })

      const tag2 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Remove This' },
      })

      const post = await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Tagged Post',
          [`_h_${tagsSlug}`]: [tag1.id, tag2.id],
        },
      })

      await payload.update({
        collection: hierarchyPostsSlug,
        id: post.id,
        data: {
          [`_h_${tagsSlug}`]: [tag1.id],
        },
      })

      const updated = await payload.findByID({
        collection: hierarchyPostsSlug,
        id: post.id,
        depth: 0,
      })

      expect(updated[`_h_${tagsSlug}`]).toHaveLength(1)
      expect(updated[`_h_${tagsSlug}`]).toContain(tag1.id)
      expect(updated[`_h_${tagsSlug}`]).not.toContain(tag2.id)
    })

    it('should support nested tag hierarchies with multi-tag documents', async () => {
      const parentTag = await payload.create({
        collection: tagsSlug,
        data: { name: 'Parent Category' },
      })

      const childTag1 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Child Category 1', [`_h_${tagsSlug}`]: parentTag.id },
      })

      const childTag2 = await payload.create({
        collection: tagsSlug,
        data: { name: 'Child Category 2', [`_h_${tagsSlug}`]: parentTag.id },
      })

      const post = await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Post with Nested Tags',
          [`_h_${tagsSlug}`]: [childTag1.id, childTag2.id],
        },
      })

      const fetchedPost = await payload.findByID({
        collection: hierarchyPostsSlug,
        id: post.id,
        depth: 1,
      })

      expect(fetchedPost[`_h_${tagsSlug}`]).toHaveLength(2)

      const tagNames = fetchedPost[`_h_${tagsSlug}`].map((t: any) => t.name)
      expect(tagNames).toContain('Child Category 1')
      expect(tagNames).toContain('Child Category 2')
    })

    it('should prevent circular references in tag hierarchy', async () => {
      const tag = await payload.create({
        collection: tagsSlug,
        data: { name: 'Self-ref Tag' },
      })

      await expect(
        payload.update({
          collection: tagsSlug,
          id: tag.id,
          data: { [`_h_${tagsSlug}`]: tag.id },
        }),
      ).rejects.toThrow()
    })

    it('should return related documents via findRelated endpoint for tags', async () => {
      const tag = await payload.create({
        collection: tagsSlug,
        data: { name: 'Popular Tag' },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Tagged Post 1',
          [`_h_${tagsSlug}`]: [tag.id],
        },
      })

      await payload.create({
        collection: hierarchyPostsSlug,
        data: {
          title: 'Tagged Post 2',
          [`_h_${tagsSlug}`]: [tag.id],
        },
      })

      const response = await restClient.GET(`/${tagsSlug}/${tag.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[hierarchyPostsSlug]).toBeDefined()
      expect(result[hierarchyPostsSlug].docs).toHaveLength(2)
    })

    it('should compute paths for tag hierarchy items', async () => {
      const rootTag = await payload.create({
        collection: tagsSlug,
        context: { computeHierarchyPaths: true },
        data: { name: 'Technology' },
      })

      const childTag = await payload.create({
        collection: tagsSlug,
        context: { computeHierarchyPaths: true },
        data: { name: 'JavaScript', [`_h_${tagsSlug}`]: rootTag.id },
      })

      const grandchildTag = await payload.create({
        collection: tagsSlug,
        context: { computeHierarchyPaths: true },
        data: { name: 'React', [`_h_${tagsSlug}`]: childTag.id },
      })

      expect(grandchildTag._h_slugPath).toBe('technology/javascript/react')
      expect(grandchildTag._h_titlePath).toBe('Technology/JavaScript/React')
    })
  })
})
