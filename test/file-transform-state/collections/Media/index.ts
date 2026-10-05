import type { CollectionConfig } from 'payload'

import { mediaSlug } from '../../shared.js'

export const Media: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    readVersions: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      validate: (value) => (value === 'invalid' ? 'Invalid transformed title.' : true),
    },
    {
      name: 'appliedState',
      type: 'json',
      validate: (value) =>
        value?.title === 'invalid' ? 'Invalid nested transformed title.' : true,
    },
    { name: 'entryMimeType', type: 'text' },
  ],
  hooks: {
    afterChange: [
      ({ context, doc }) => {
        if (context.rejectAfterChange) {
          throw new Error('Rejected transform write.')
        }

        return doc
      },
    ],
    beforeChange: [
      ({ context, data }) =>
        context.applyRotation ? { ...data, _transforms: { rotate: { angle: 90 } } } : data,
    ],
  },
  upload: { filesRequiredOnCreate: false },
  versions: { drafts: true },
}
