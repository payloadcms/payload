import type { Config } from '../../config/types.js'
import type { CollectionConfig, Field } from '../../index.js'

import { ReservedFieldName } from '../../errors/index.js'
import { sanitizeCollection } from '../../collections/config/sanitize.js'
import { describe, it, expect } from 'vitest'

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

    it('should throw on file', () => {
      const fields: Field[] = [
        {
          name: 'file',
          type: 'text',
          label: 'some-collection',
        },
      ]

      expect(() => {
        sanitizeCollection(
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
      }).toThrow(ReservedFieldName)
    })

    it('should not throw on a custom field', () => {
      const fields: Field[] = [
        {
          name: 'customField',
          type: 'text',
          label: 'some-collection',
        },
      ]

      expect(() => {
        sanitizeCollection(
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

    it('should throw on hash', () => {
      const fields: Field[] = [
        {
          name: 'hash',
          type: 'text',
          label: 'some-collection',
        },
      ]

      expect(() => {
        sanitizeCollection(
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
      }).toThrow(ReservedFieldName)
    })

    it('should throw on salt', () => {
      const fields: Field[] = [
        {
          name: 'salt',
          type: 'text',
          label: 'some-collection',
        },
      ]

      expect(() => {
        sanitizeCollection(
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
      }).toThrow(ReservedFieldName)
    })

    it('should not throw on a custom field', () => {
      const fields: Field[] = [
        {
          name: 'customField',
          type: 'text',
          label: 'some-collection',
        },
      ]

      expect(() => {
        sanitizeCollection(
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
