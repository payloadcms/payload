import { APIError, type CollectionConfig } from 'payload'

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
    {
      name: 'shouldThrow',
      type: 'checkbox',
      admin: {
        description:
          'When enabled, the afterChange hook throws during the cloud-storage plugin internal update. Used to reproduce the swallowed-error bug in the admin panel and integration tests.',
      },
      defaultValue: false,
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, operation, req }) => {
        if (operation === 'update' && req.context?.skipCloudStorage && doc.shouldThrow) {
          throw new APIError(throwingHookError, 500, null, true)
        }

        return doc
      },
    ],
  },
  upload: {
    disableLocalStorage: true,
  },
  versions: false,
}
