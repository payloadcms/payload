import type { Config } from '../../config/types.js'
import type { CollectionConfig, Field } from '../../index.js'

import { ReservedFieldName } from '../../errors/index.js'
import { sanitizeCollection } from './sanitize.js'

describe('reservedFieldNames - collections -', () => {
  const config = {
    collections: [],
    globals: [],
  } as Partial<Config>

  describe('uploads -', () => {
    const collectionWithUploads: CollectionConfig = {
      slug: 'collection-with-uploads',
      fields: [],
      upload: true,
    }

    it('should throw on file', async () => {
      const fields: Field[] = [
        {
          name: 'file',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [
              {
                ...collectionWithUploads,
                fields,
              },
            ],
          },
          {
            ...collectionWithUploads,
            fields,
          },
        )
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should not throw on a custom field', async () => {
      const fields: Field[] = [
        {
          name: 'customField',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [
              {
                ...collectionWithUploads,
                fields,
              },
            ],
          },
          {
            ...collectionWithUploads,
            fields,
          },
        )
      }).not.toThrow()
    })
  })

  describe('auth -', () => {
    const collectionWithAuth: CollectionConfig = {
      slug: 'collection-with-auth',
      auth: {
        loginWithUsername: true,
        useAPIKey: true,
        verify: true,
      },
      fields: [],
    }

    it('should throw on hash', async () => {
      const fields: Field[] = [
        {
          name: 'hash',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [
              {
                ...collectionWithAuth,
                fields,
              },
            ],
          },
          {
            ...collectionWithAuth,
            fields,
          },
        )
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should throw on salt', async () => {
      const fields: Field[] = [
        {
          name: 'salt',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [
              {
                ...collectionWithAuth,
                fields,
              },
            ],
          },
          {
            ...collectionWithAuth,
            fields,
          },
        )
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should not throw on a custom field', async () => {
      const fields: Field[] = [
        {
          name: 'customField',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeCollection(
          // @ts-expect-error
          {
            ...config,
            collections: [
              {
                ...collectionWithAuth,
                fields,
              },
            ],
          },
          {
            ...collectionWithAuth,
            fields,
          },
        )
      }).not.toThrow()
    })
  })
})
