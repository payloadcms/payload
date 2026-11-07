import type { Config } from '../../config/types.js'
import type { CollectionConfig } from '../../index.js'

import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from '../../config/sanitize.js'
import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'

const configDefaults: Config = {
  db: {
    defaultIDType: 'text',
    // @ts-expect-error partial config
    init: () => {},
  },
  secret: 'secret',
}

const sanitizeWithCollections = (collections: CollectionConfig[]) =>
  sanitizeConfig({ ...configDefaults, collections })

describe('sanitize - collections -', () => {
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
      expect(() =>
        sanitizeWithCollections([
          {
            ...defaultCollection,
            admin: {
              listSearchableFields: ['title', 'nonExistentField'],
            },
          },
        ]),
      ).toThrow(InvalidConfiguration)
    })

    it('should not throw when all fields exist', () => {
      expect(() =>
        sanitizeWithCollections([
          {
            ...defaultCollection,
            admin: {
              listSearchableFields: ['title', 'slug'],
            },
          },
        ]),
      ).not.toThrow()
    })

    it('should not throw on default field: id', () => {
      expect(() =>
        sanitizeWithCollections([
          {
            ...defaultCollection,
            admin: {
              listSearchableFields: ['id'],
            },
          },
        ]),
      ).not.toThrow()
    })

    it('should not throw when listSearchableFields is undefined', () => {
      expect(() => sanitizeWithCollections([defaultCollection])).not.toThrow()
    })

    it('should accept the hierarchy type field injected after collection sanitization', () => {
      expect(() =>
        sanitizeWithCollections([
          {
            slug: 'folders',
            admin: {
              listSearchableFields: ['name', 'hierarchyType'],
              useAsTitle: 'name',
            },
            fields: [{ name: 'name', type: 'text' }],
            hierarchy: {
              collectionSpecific: true,
            },
          },
        ]),
      ).not.toThrow()
    })
  })
})
