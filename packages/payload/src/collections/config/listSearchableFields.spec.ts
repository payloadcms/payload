import type { Config } from '../../config/types.js'
import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { sanitizeCollection } from './sanitize.js'
import { describe, it, expect } from 'vitest'

describe('sanitize - collections -', () => {
  const config = {
    collections: [],
    globals: [],
  } as Partial<Config>

  describe('validate listSearchableFields -', () => {
    const defaultCollection: CollectionConfig = {
      slug: 'collection-with-defaults',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    }

    it('should throw on non-existent field', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          listSearchableFields: ['title', 'nonExistentField'],
        },
      }
      expect(() => {
        sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).toThrow(InvalidConfiguration)
    })

    it('should not throw when all fields exist', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          listSearchableFields: ['title', 'slug'],
        },
      }
      expect(() => {
        sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })

    it('should not throw on default field: id', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          listSearchableFields: ['id'],
        },
      }
      expect(() => {
        sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })

    it('should not throw when listSearchableFields is undefined', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
      }
      expect(() => {
        sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })
  })
})
