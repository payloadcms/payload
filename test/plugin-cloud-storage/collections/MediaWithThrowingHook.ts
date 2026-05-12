import type { CollectionConfig } from 'payload'

import { mediaWithThrowingHookSlug } from '../shared.js'

export const throwingHookError = 'User afterChange hook throws error'

export const MediaWithThrowingHook: CollectionConfig = {
  slug: mediaWithThrowingHookSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, operation, req }) => {
        if (
          operation === 'update' &&
          req.context?.skipCloudStorage &&
          req.context?.simulateUserHookError
        ) {
          throw new Error(throwingHookError)
        }
        return doc
      },
    ],
  },
  upload: {
    disableLocalStorage: true,
  },
}
