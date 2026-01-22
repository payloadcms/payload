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
    it('should add hierarchy fields to collection', () => {
      const pagesCollection = payload.collections.pages.config

      // Check that hierarchy fields were added
      const hierarchyFields = pagesCollection.fields.filter((field) => field.name.startsWith('_h_'))

      expect(hierarchyFields.length).toBeGreaterThan(0)

      // Check for specific fields
      const slugPathField = pagesCollection.fields.find((f) => f.name === '_h_slugPath')
      const titlePathField = pagesCollection.fields.find((f) => f.name === '_h_titlePath')
      const depthField = pagesCollection.fields.find((f) => f.name === '_h_depth')
      const parentTreeField = pagesCollection.fields.find((f) => f.name === '_h_parentTree')

      expect(slugPathField).toBeDefined()
      expect(titlePathField).toBeDefined()
      expect(depthField).toBeDefined()
      expect(parentTreeField).toBeDefined()
    })

    it('should have sanitized hierarchy config', () => {
      const pagesCollection = payload.collections.pages.config

      expect(pagesCollection.hierarchy).not.toBe(false)
      if (pagesCollection.hierarchy !== false) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pagesCollection.hierarchy.parentFieldName).toBe('parent')
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pagesCollection.hierarchy.slugPathFieldName).toBe('_h_slugPath')
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pagesCollection.hierarchy.titlePathFieldName).toBe('_h_titlePath')
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

    it('should generate correct tree data for root document', async () => {
      const rootPage = await payload.create({
        collection: 'pages',
        data: {
          parent: null,
          title: 'Root Page',
        },
      })

      expect(rootPage._h_depth).toBe(0)
      expect(rootPage._h_parentTree).toEqual([])
      expect(rootPage._h_slugPath).toBe('root-page')
      expect(rootPage._h_titlePath).toBe('Root Page')
    })

    it('should generate correct tree data for nested documents', async () => {
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

      expect(childPage._h_depth).toBe(1)
      expect(childPage._h_parentTree).toEqual([rootPage.id])
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

      expect(grandchildPage._h_depth).toBe(2)
      expect(grandchildPage._h_parentTree).toEqual([rootPage.id, childPage.id])
      expect(grandchildPage._h_slugPath).toBe('root/child/grandchild')
      expect(grandchildPage._h_titlePath).toBe('Root/Child/Grandchild')
    })

    it('should update descendants when parent changes', async () => {
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

      // Check child was updated
      expect(updatedChild._h_parentTree).toEqual([anotherRoot.id])
      expect(updatedChild._h_slugPath).toBe('another-root/child')
      expect(updatedChild._h_titlePath).toBe('Another Root/Child')

      // Check grandchild was updated
      const updatedGrandchild = await payload.findByID({
        id: grandchildPage.id,
        collection: 'pages',
      })

      expect(updatedGrandchild._h_parentTree).toEqual([anotherRoot.id, childPage.id])
      expect(updatedGrandchild._h_slugPath).toBe('another-root/child/grandchild')
      expect(updatedGrandchild._h_titlePath).toBe('Another Root/Child/Grandchild')
    })

    it('should update descendants when title changes', async () => {
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

      // Check child paths were updated
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

      expect(updatedChild._h_depth).toBe(0)
      expect(updatedChild._h_parentTree).toEqual([])
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
      })

      expect(updated.parent).toBe(page2.id)
      expect(updated._h_parentTree).toEqual([page2.id])
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

    it('should find all descendants of a document', async () => {
      // Create test tree
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

      const grandchild1 = await payload.create({
        collection: 'pages',
        data: { parent: child1.id, title: 'Grandchild 1' },
      })

      const descendants = await payload.find({
        collection: 'pages',
        where: {
          _h_parentTree: {
            in: [root.id],
          },
        },
      })

      expect(descendants.docs).toHaveLength(3) // child1, child2, grandchild1
      const ids = descendants.docs.map((d) => d.id)
      expect(ids).toContain(child1.id)
      expect(ids).toContain(child2.id)
      expect(ids).toContain(grandchild1.id)
    })

    it('should find documents at specific depth', async () => {
      // Create test tree
      const root = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      const child1 = await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Child 1' },
      })

      await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Child 2' },
      })

      await payload.create({
        collection: 'pages',
        data: { parent: child1.id, title: 'Grandchild 1' },
      })

      const depthOne = await payload.find({
        collection: 'pages',
        where: {
          _h_depth: { equals: 1 },
        },
      })

      expect(depthOne.docs).toHaveLength(2) // child1, child2
    })

    it('should find root documents', async () => {
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
          _h_depth: { equals: 0 },
        },
      })

      expect(roots.docs).toHaveLength(1)
      expect(roots.docs[0]!.id).toBe(root.id)
    })

    it('should find by path prefix', async () => {
      const root = await payload.create({
        collection: 'pages',
        data: { parent: null, title: 'Root' },
      })

      await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Child 1' },
      })

      await payload.create({
        collection: 'pages',
        data: { parent: root.id, title: 'Child 2' },
      })

      const underRoot = await payload.find({
        collection: 'pages',
        where: {
          _h_slugPath: {
            like: 'root/',
          },
        },
      })

      expect(underRoot.docs.length).toBeGreaterThanOrEqual(2)
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

        expect(currentParent._h_depth).toBe(i)
        expect(currentParent._h_parentTree?.length || 0).toBe(i)
      }

      // Verify the deepest level
      if (currentParent) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(currentParent._h_depth).toBe(9)
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(currentParent._h_parentTree).toHaveLength(9)
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(currentParent._h_slugPath).toContain('/')
        const pathSegments = currentParent._h_slugPath?.split('/')
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(pathSegments).toHaveLength(10) // level-0 through level-9
      }
    })
  })

  describe('Multiple Collections', () => {
    beforeEach(async () => {
      // Clear existing data before each test
      await payload.delete({ collection: 'categories', where: {} })
      await payload.delete({ collection: 'departments', where: {} })
    })

    afterEach(async () => {
      // Clean up data after each test
      await payload.delete({ collection: 'categories', where: {} })
      await payload.delete({ collection: 'departments', where: {} })
    })

    it('should work with multiple collections having hierarchy', async () => {
      // Create in categories
      const rootCat = await payload.create({
        collection: 'categories',
        data: { name: 'Electronics', parentCategory: null },
      })

      const childCat = await payload.create({
        collection: 'categories',
        data: { name: 'Laptops', parentCategory: rootCat.id },
      })

      expect(childCat._h_depth).toBe(1)
      expect(childCat._h_parentTree).toEqual([rootCat.id])

      // Create in departments
      const rootDept = await payload.create({
        collection: 'departments',
        data: { deptName: 'Engineering', parentDept: null },
      })

      const childDept = await payload.create({
        collection: 'departments',
        data: { deptName: 'Frontend', parentDept: rootDept.id },
      })

      // Check custom field names are used
      expect(childDept._breadcrumbSlug).toBeDefined()
      expect(childDept._breadcrumbTitle).toBeDefined()
      expect(childDept._breadcrumbSlug).toBe('engineering/frontend')
      expect(childDept._breadcrumbTitle).toBe('Engineering/Frontend')
    })
  })

  describe('generatePaths: false', () => {
    beforeEach(async () => {
      // Clear existing data before each test
      await payload.delete({ collection: 'organizations', where: {} })
    })

    afterEach(async () => {
      // Clean up data after each test
      await payload.delete({ collection: 'organizations', where: {} })
    })

    it('should not add path fields when generatePaths is false', () => {
      const orgsCollection = payload.collections.organizations.config

      // Check that path fields were NOT added
      const slugPathField = orgsCollection.fields.find((f) => f.name === '_h_slugPath')
      const titlePathField = orgsCollection.fields.find((f) => f.name === '_h_titlePath')

      expect(slugPathField).toBeUndefined()
      expect(titlePathField).toBeUndefined()

      // But tree fields SHOULD exist
      const depthField = orgsCollection.fields.find((f) => f.name === '_h_depth')
      const parentTreeField = orgsCollection.fields.find((f) => f.name === '_h_parentTree')

      expect(depthField).toBeDefined()
      expect(parentTreeField).toBeDefined()

      // Check hierarchy config
      expect(orgsCollection.hierarchy).not.toBe(false)
      if (orgsCollection.hierarchy !== false) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(orgsCollection.hierarchy.generatePaths).toBe(false)
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(orgsCollection.hierarchy.parentFieldName).toBe('parentOrg')
      }
    })

    it('should track parent tree and depth without paths', async () => {
      // Create root
      const rootOrg = await payload.create({
        collection: 'organizations',
        data: {
          orgName: 'Acme Corp',
          parentOrg: null,
        },
      })

      expect(rootOrg._h_depth).toBe(0)
      expect(rootOrg._h_parentTree).toEqual([])
      // Path fields should not exist
      expect(rootOrg._h_slugPath).toBeUndefined()
      expect(rootOrg._h_titlePath).toBeUndefined()

      // Create child
      const childOrg = await payload.create({
        collection: 'organizations',
        data: {
          orgName: 'Engineering Division',
          parentOrg: rootOrg.id,
        },
      })

      expect(childOrg._h_depth).toBe(1)
      expect(childOrg._h_parentTree).toEqual([rootOrg.id])
      // Path fields should not exist
      expect(childOrg._h_slugPath).toBeUndefined()
      expect(childOrg._h_titlePath).toBeUndefined()

      // Create grandchild
      const grandchildOrg = await payload.create({
        collection: 'organizations',
        data: {
          orgName: 'Frontend Team',
          parentOrg: childOrg.id,
        },
      })

      expect(grandchildOrg._h_depth).toBe(2)
      expect(grandchildOrg._h_parentTree).toEqual([rootOrg.id, childOrg.id])
      expect(grandchildOrg._h_slugPath).toBeUndefined()
      expect(grandchildOrg._h_titlePath).toBeUndefined()
    })

    it('should update descendants without paths when parent changes', async () => {
      // Create initial tree
      const rootOrg = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Root', parentOrg: null },
      })

      const anotherRoot = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Another Root', parentOrg: null },
      })

      const childOrg = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Child', parentOrg: rootOrg.id },
      })

      const grandchildOrg = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Grandchild', parentOrg: childOrg.id },
      })

      // Move child to another root
      const updatedChild = await payload.update({
        id: childOrg.id,
        collection: 'organizations',
        data: { parentOrg: anotherRoot.id },
      })

      // Check child was updated
      expect(updatedChild._h_parentTree).toEqual([anotherRoot.id])
      expect(updatedChild._h_depth).toBe(1)
      expect(updatedChild._h_slugPath).toBeUndefined()
      expect(updatedChild._h_titlePath).toBeUndefined()

      // Check grandchild was updated
      const updatedGrandchild = await payload.findByID({
        id: grandchildOrg.id,
        collection: 'organizations',
      })

      expect(updatedGrandchild._h_parentTree).toEqual([anotherRoot.id, childOrg.id])
      expect(updatedGrandchild._h_depth).toBe(2)
      expect(updatedGrandchild._h_slugPath).toBeUndefined()
      expect(updatedGrandchild._h_titlePath).toBeUndefined()
    })

    it('should support descendant queries without paths', async () => {
      // Create test tree
      const root = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Root', parentOrg: null },
      })

      const child1 = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Child 1', parentOrg: root.id },
      })

      const child2 = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Child 2', parentOrg: root.id },
      })

      const grandchild1 = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Grandchild 1', parentOrg: child1.id },
      })

      // Query descendants
      const descendants = await payload.find({
        collection: 'organizations',
        where: {
          _h_parentTree: {
            in: [root.id],
          },
        },
      })

      expect(descendants.docs).toHaveLength(3) // child1, child2, grandchild1
      const ids = descendants.docs.map((d) => d.id)
      expect(ids).toContain(child1.id)
      expect(ids).toContain(child2.id)
      expect(ids).toContain(grandchild1.id)
    })

    it('should support depth queries without paths', async () => {
      const root = await payload.create({
        collection: 'organizations',
        data: { orgName: 'Root', parentOrg: null },
      })

      await payload.create({
        collection: 'organizations',
        data: { orgName: 'Child 1', parentOrg: root.id },
      })

      await payload.create({
        collection: 'organizations',
        data: { orgName: 'Child 2', parentOrg: root.id },
      })

      const depthOne = await payload.find({
        collection: 'organizations',
        where: {
          _h_depth: { equals: 1 },
        },
      })

      expect(depthOne.docs).toHaveLength(2) // child1, child2
    })
  })

  describe('Draft Versions', () => {
    it('should update both published and draft versions when moving parent', async () => {
      // Create published page with draft changes
      const parent = await payload.create({
        collection: 'pages',
        data: { title: 'Products', parent: null },
      })

      const child = await payload.create({
        collection: 'pages',
        data: { title: 'Clothing', parent: parent.id },
      })

      // Publish child
      await payload.update({
        collection: 'pages',
        id: child.id,
        data: { _status: 'published' },
        draft: false,
      })

      // Create draft with title change
      await payload.update({
        collection: 'pages',
        id: child.id,
        data: { title: 'Apparel' }, // Draft change
        draft: true,
      })

      // Move parent
      const newParent = await payload.create({
        collection: 'pages',
        data: { title: 'Categories', parent: null },
      })

      await payload.update({
        collection: 'pages',
        id: parent.id,
        data: { parent: newParent.id },
      })

      // Verify published version has new path
      const publishedChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
      })

      expect(publishedChild._h_slugPath).toBe('categories/products/clothing')

      // Verify draft version ALSO has new path
      const draftChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
        draft: true,
      })

      expect(draftChild._h_slugPath).toBe('categories/products/apparel') // Uses draft title
    })

    it('should update only published version when no draft exists', async () => {
      // Create and publish parent
      const parent = await payload.create({
        collection: 'pages',
        data: { title: 'Services', parent: null, _status: 'published' },
      })

      // Create and publish child (no draft changes)
      const child = await payload.create({
        collection: 'pages',
        data: { title: 'Consulting', parent: parent.id, _status: 'published' },
      })

      // Move parent
      const newParent = await payload.create({
        collection: 'pages',
        data: { title: 'Offerings', parent: null },
      })

      await payload.update({
        collection: 'pages',
        id: parent.id,
        data: { parent: newParent.id },
      })

      // Verify published version has new path
      const publishedChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
      })

      expect(publishedChild._h_slugPath).toBe('offerings/services/consulting')
      expect(publishedChild._status).toBe('published')

      // Verify that fetching draft returns the same as published (no separate draft created)
      const draftChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
        draft: true,
      })

      // When no draft exists, draft: true returns the most recent version (published)
      expect(draftChild._h_slugPath).toBe('offerings/services/consulting')
      expect(draftChild._status).toBe('published')
    })

    it('should handle draft-only documents (never published)', async () => {
      // Create parent as draft
      const parent = await payload.create({
        collection: 'pages',
        data: { title: 'Future', parent: null },
        draft: true,
      })

      // Create child as draft
      const child = await payload.create({
        collection: 'pages',
        data: { title: 'Plans', parent: parent.id },
        draft: true,
      })

      // Move parent
      const newParent = await payload.create({
        collection: 'pages',
        data: { title: 'Roadmap', parent: null },
      })

      await payload.update({
        collection: 'pages',
        id: parent.id,
        data: { parent: newParent.id },
        draft: true,
      })

      // Verify draft version has new path
      const draftChild = await payload.findByID({
        collection: 'pages',
        id: child.id,
        draft: true,
      })

      expect(draftChild._h_slugPath).toBe('roadmap/future/plans')
      expect(draftChild._status).toBe('draft')
    })

    it('should handle collections without versioning', async () => {
      // Categories collection has no versioning enabled
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

      // Should not throw error even though collection has no versioning
      await payload.update({
        collection: 'categories',
        id: parent.id,
        data: { parentCategory: newParent.id },
      })

      const updatedChild = await payload.findByID({
        collection: 'categories',
        id: child.id,
      })

      expect(updatedChild._h_slugPath).toBe('tech/electronics/phones')
    })
  })
})
