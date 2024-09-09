import type { Config } from '../../config/types.js'
import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { sanitizeCollection } from './sanitize.js'

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

    it('should throw on invalid field', async () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'invalidField',
        },
      }
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).rejects.toThrow(InvalidConfiguration)
    })

    it('should not throw on valid field', async () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'title',
        },
      }
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })

    it('should not throw on valid field inside tabs', async () => {
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
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })

    it('should not throw on valid field inside collapsibles', async () => {
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
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })

    it('should throw on nested useAsTitle', async () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'content.title',
        },
      }
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).rejects.toThrow(InvalidConfiguration)
    })

    it('should not throw on default field: id', async () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'id',
        },
      }
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })

    it('should not throw on default field: email if auth is enabled', async () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        auth: true,
        admin: {
          useAsTitle: 'email',
        },
      }
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).not.toThrow()
    })
    it('should throw on default field: email if auth is not enabled', async () => {
      const collectionConfig: CollectionConfig = {
        ...defaultCollection,
        admin: {
          useAsTitle: 'email',
        },
      }
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [collectionConfig],
          },
          collectionConfig,
        )
      }).rejects.toThrow(InvalidConfiguration)
    })
  })
})
