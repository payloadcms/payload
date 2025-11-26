import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Page } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

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
      // eslint-disable-next-line jest/no-conditional-in-test
      if (pagesCollection.hierarchy !== false) {
        expect(pagesCollection.hierarchy.parentFieldName).toBe('parent')
        expect(pagesCollection.hierarchy.slugPathFieldName).toBe('_h_slugPath')
        expect(pagesCollection.hierarchy.titlePathFieldName).toBe('_h_titlePath')
        expect(pagesCollection.hierarchy.depthFieldName).toBe('_h_depth')
        expect(pagesCollection.hierarchy.parentTreeFieldName).toBe('_h_parentTree')
      }
    })

    it('should support custom field names', () => {
      const deptsCollection = payload.collections.departments.config

      expect(deptsCollection.hierarchy).not.toBe(false)
      // eslint-disable-next-line jest/no-conditional-in-test
      if (deptsCollection.hierarchy !== false) {
        expect(deptsCollection.hierarchy.parentFieldName).toBe('parentDept')
        expect(deptsCollection.hierarchy.slugPathFieldName).toBe('_breadcrumbSlug')
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
      // eslint-disable-next-line jest/no-conditional-in-test
      if (currentParent) {
        expect(currentParent._h_depth).toBe(9)
        expect(currentParent._h_parentTree).toHaveLength(9)
        expect(currentParent._h_slugPath).toContain('/')
        const pathSegments = currentParent._h_slugPath?.split('/')
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
})
