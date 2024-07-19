import type { Config } from '../../config/types.js'
import type { CollectionConfig, Field } from '../../index.js'

import { ReservedFieldName } from '../../errors/index.js'
import { sanitizeCollection } from './sanitize.js'

describe('reservedFieldNames - collections -', () => {
  const config = {
    collections: [],
    globals: [],
  } as Partial<Config>

  describe('versions -', () => {
    const collectionWithVersions: CollectionConfig = {
      slug: 'collection-with-versions',
      fields: [],
      versions: true,
    }

    it('should throw on __v', async () => {
      const fields: Field[] = [
        {
          name: '__v',
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
                ...collectionWithVersions,
                fields,
              },
            ],
          },
          {
            ...collectionWithVersions,
            fields,
          },
        )
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should throw on _status', async () => {
      const fields: Field[] = [
        {
          name: '_status',
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
                ...collectionWithVersions,
                fields,
              },
            ],
          },
          {
            ...collectionWithVersions,
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
                ...collectionWithVersions,
                fields,
              },
            ],
          },
          {
            ...collectionWithVersions,
            fields,
          },
        )
      }).not.toThrow()
    })
  })

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

    it('should throw on mimeType', async () => {
      const fields: Field[] = [
        {
          name: 'mimeType',
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
      fields: [],
      auth: {
        verify: true,
        useAPIKey: true,
        loginWithUsername: true,
      },
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

    it('should throw on email', async () => {
      const fields: Field[] = [
        {
          name: 'email',
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

    it('should throw on _verified', async () => {
      const fields: Field[] = [
        {
          name: '_verified',
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

    it('should throw on apiKey', async () => {
      const fields: Field[] = [
        {
          name: 'apiKey',
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
