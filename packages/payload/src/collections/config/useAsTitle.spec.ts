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

  describe('validate useAsTitle -', () => {
    const defaultCollection: CollectionConfig = {
      slug: 'collection-with-defaults',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    }

    it('should throw on invalid field', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'invalidField',
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

    it('should not throw on valid field', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'title',
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

    it('should not throw on valid field inside tabs', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'title',
        },
        fields: [
          {
            type: 'tabs',
            tabs: [
              {
                label: 'General',
                fields: [
                  {
                    name: 'title',
                    type: 'text',
                  },
                ],
              },
            ],
          },
        ],
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

    it('should not throw on valid field inside collapsibles', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'title',
        },
        fields: [
          {
            type: 'collapsible',
            label: 'Collapsible',
            fields: [
              {
                name: 'title',
                type: 'text',
              },
            ],
          },
        ],
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

    it('should throw on nested useAsTitle', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'content.title',
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

    it('should not throw on default field: id', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'id',
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

    it('should not throw on default field: email if auth is enabled', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        auth: true,
        admin: {
          useAsTitle: 'email',
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
    it('should throw on default field: email if auth is not enabled', () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'email',
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
  })
})
