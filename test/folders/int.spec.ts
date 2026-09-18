import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { folderSlug, postSlug } from './shared.js'

test.suite({ config: './config.ts', resetBetweenTests: false })('Folders Helpers', () => {
  test.describe('createFoldersCollection', () => {
    test('should create a collection with hierarchy enabled', ({ payload }) => {
      const foldersCollection = payload.collections[folderSlug].config

      expect(foldersCollection.hierarchy).toBeDefined()
      expect(foldersCollection.hierarchy).not.toBe(false)
    })

    test('should add parent field with correct name', ({ payload }) => {
      const foldersCollection = payload.collections[folderSlug].config
      expect(foldersCollection.hierarchy).not.toBe(false)

      if (foldersCollection.hierarchy !== false) {
        const parentFieldName = foldersCollection.hierarchy.parentFieldName
        const parentField = foldersCollection.fields.find(
          (f: any) => f.name === parentFieldName && f.type === 'relationship',
        )

        expect(parentField).toBeDefined()

        expect(parentField).toMatchObject({
          type: 'relationship',
          relationTo: folderSlug,
        })
      }
    })

    test('should add collectionSpecific field when configured', ({ payload }) => {
      const foldersCollection = payload.collections[folderSlug].config

      if (foldersCollection.hierarchy !== false && foldersCollection.hierarchy.collectionSpecific) {
        const fieldName = foldersCollection.hierarchy.collectionSpecific.fieldName
        const collectionSpecificField = foldersCollection.fields.find(
          (f: any) => f.name === fieldName,
        )

        expect(collectionSpecificField).toBeDefined()
      }
    })

    test('should add join field when configured', ({ payload }) => {
      const foldersCollection = payload.collections[folderSlug].config

      if (foldersCollection.hierarchy !== false && foldersCollection.hierarchy.joinField) {
        const joinFieldName = foldersCollection.hierarchy.joinField.name
        const joinField = foldersCollection.fields.find(
          (f: any) => f.name === joinFieldName && f.type === 'join',
        )

        expect(joinField).toBeDefined()

        expect(joinField?.type).toBe('join')
      }
    })

    test('should add virtual path fields', ({ payload }) => {
      const foldersCollection = payload.collections[folderSlug].config

      const slugPathField = foldersCollection.fields.find((f: any) => f.name === '_h_slugPath')
      const titlePathField = foldersCollection.fields.find((f: any) => f.name === '_h_titlePath')

      expect(slugPathField).toBeDefined()
      expect(titlePathField).toBeDefined()
      expect(slugPathField?.virtual).toBe(true)
      expect(titlePathField?.virtual).toBe(true)
    })
  })

  test.describe('createFolderField', () => {
    test('should add folder relationship field to collection', ({ payload }) => {
      const postsCollection = payload.collections[postSlug].config
      const folderField = postsCollection.fields.find(
        (f: any) => f.name === 'folder' && f.type === 'relationship',
      )

      expect(folderField).toBeDefined()
      expect(folderField).toMatchObject({
        type: 'relationship',
        relationTo: folderSlug,
        hasMany: false,
      })
    })
  })
})
