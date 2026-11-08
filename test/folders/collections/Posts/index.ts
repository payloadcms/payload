import { APIError, type CollectionConfig } from 'payload'

import { postSlug } from '../../shared.js'

export const throwingMoveHookError = 'Post is not allowed to be moved'

export const Posts: CollectionConfig = {
  slug: postSlug,
  admin: {
    useAsTitle: 'title',
  },
  folders: true,
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'relatedAutosave',
      type: 'relationship',
      relationTo: 'autosave',
    },
    {
      name: 'shouldFailMove',
      type: 'checkbox',
      admin: {
        description:
          'When enabled, the beforeChange hook throws whenever this document is updated. Used to reproduce a partial failure within a bulk folder move.',
      },
      defaultValue: false,
    },
  ],
  hooks: {
    beforeChange: [
      ({ operation, originalDoc }) => {
        if (operation === 'update' && originalDoc?.shouldFailMove) {
          throw new APIError(throwingMoveHookError, 400, null, true)
        }
      },
    ],
  },
}
