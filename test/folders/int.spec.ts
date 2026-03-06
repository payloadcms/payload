import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { categoriesSlug, folderSlug, postSlug } from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Folders Helpers', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('createFoldersCollection', () => {
    it('should create a collection with hierarchy enabled', () => {
      const foldersCollection = payload.collections[folderSlug].config

      expect(foldersCollection.hierarchy).toBeDefined()
      expect(foldersCollection.hierarchy).not.toBe(false)
    })

    it('should add parent field with correct name', () => {
      const foldersCollection = payload.collections[folderSlug].config
      expect(foldersCollection.hierarchy).not.toBe(false)

      if (foldersCollection.hierarchy !== false) {
        const parentFieldName = foldersCollection.hierarchy.parentFieldName
        const parentField = foldersCollection.fields.find(
          (f: any) => f.name === parentFieldName && f.type === 'relationship',
        )

        // eslint-disable-next-line vitest/no-conditional-expect
        expect(parentField).toBeDefined()
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(parentField).toMatchObject({
          type: 'relationship',
          relationTo: folderSlug,
        })
      }
    })

    it('should add collectionSpecific field when configured', () => {
      const foldersCollection = payload.collections[folderSlug].config

      if (foldersCollection.hierarchy !== false && foldersCollection.hierarchy.collectionSpecific) {
        const fieldName = foldersCollection.hierarchy.collectionSpecific.fieldName
        const collectionSpecificField = foldersCollection.fields.find(
          (f: any) => f.name === fieldName,
        )

        // eslint-disable-next-line vitest/no-conditional-expect
        expect(collectionSpecificField).toBeDefined()
      }
    })

    it('should add join field when configured', () => {
      const foldersCollection = payload.collections[folderSlug].config

      if (foldersCollection.hierarchy !== false && foldersCollection.hierarchy.joinField) {
        const joinFieldName = foldersCollection.hierarchy.joinField.name
        const joinField = foldersCollection.fields.find(
          (f: any) => f.name === joinFieldName && f.type === 'join',
        )

        // eslint-disable-next-line vitest/no-conditional-expect
        expect(joinField).toBeDefined()
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(joinField?.type).toBe('join')
      }
    })

    it('should add virtual path fields', () => {
      const foldersCollection = payload.collections[folderSlug].config

      const slugPathField = foldersCollection.fields.find((f: any) => f.name === '_h_slugPath')
      const titlePathField = foldersCollection.fields.find((f: any) => f.name === '_h_titlePath')

      expect(slugPathField).toBeDefined()
      expect(titlePathField).toBeDefined()
      expect(slugPathField?.virtual).toBe(true)
      expect(titlePathField?.virtual).toBe(true)
    })
  })

  describe('createFolderField', () => {
    it('should add folder relationship field to collection', () => {
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

  describe('createTagsCollection (categories)', () => {
    it('should create a collection with hierarchy enabled', () => {
      const categoriesCollection = payload.collections[categoriesSlug].config

      expect(categoriesCollection.hierarchy).toBeDefined()
      expect(categoriesCollection.hierarchy).not.toBe(false)
    })

    it('should add parent field for tag hierarchy', () => {
      const categoriesCollection = payload.collections[categoriesSlug].config
      expect(categoriesCollection.hierarchy).not.toBe(false)

      if (categoriesCollection.hierarchy !== false) {
        const parentFieldName = categoriesCollection.hierarchy.parentFieldName
        const parentField = categoriesCollection.fields.find(
          (f: any) => f.name === parentFieldName && f.type === 'relationship',
        )

        // eslint-disable-next-line vitest/no-conditional-expect
        expect(parentField).toBeDefined()
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(parentField).toMatchObject({
          type: 'relationship',
          relationTo: categoriesSlug,
          hasMany: false,
        })
      }
    })
  })

  describe('createTagField (categories on posts)', () => {
    it('should add tag relationship field to collection', () => {
      const postsCollection = payload.collections[postSlug].config
      const tagField = postsCollection.fields.find(
        (f: any) => f.name === `_h_${categoriesSlug}` && f.type === 'relationship',
      )

      expect(tagField).toBeDefined()
      expect(tagField).toMatchObject({
        type: 'relationship',
        relationTo: categoriesSlug,
        hasMany: true,
      })
    })
  })
})
