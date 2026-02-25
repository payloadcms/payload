import type { CollectionConfig } from 'payload'

import { restrictedTrashSlug } from '../../shared.js'

/**
 * This collection only allows admins to delete (both trash and permanent delete).
 */
export const RestrictedTrash: CollectionConfig = {
  slug: restrictedTrashSlug,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    delete: ({ req: { user } }) => {
      // Allow delete access if the user has the 'dev@' email
      return Boolean(user?.email?.includes('dev@'))
    },
  },
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
