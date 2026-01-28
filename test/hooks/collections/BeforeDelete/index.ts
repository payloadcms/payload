import { APIError, type CollectionConfig } from 'payload'

export const BeforeDeleteCollection: CollectionConfig = {
  slug: 'before-delete-hooks',
  hooks: {
    beforeDelete: [
      ({ id }) => {
        throw new APIError(`Test error: cannot delete document with ID ${id}`, 401)
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export const BeforeDelete2Collection: CollectionConfig = {
  slug: 'before-delete-2-hooks',
  hooks: {
    beforeDelete: [
      ({ id }) => {
        throw new Error(`Test error: cannot delete document with ID ${id}`)
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
