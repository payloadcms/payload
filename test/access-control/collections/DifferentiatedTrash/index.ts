import type { CollectionConfig } from 'payload'

import { differentiatedTrashSlug } from '../../shared.js'

/**
 * This collection demonstrates differentiated delete/trash access control.
 *
 * The pattern works like publish access control:
 * - When trashing: `data.deletedAt` is passed to the access function (similar to `data._status: 'published'` for publish)
 * - When permanently deleting: `data` is undefined
 *
 * This allows the access function to distinguish between:
 * - Regular users: Can trash (data.deletedAt set) but cannot permanently delete (data undefined)
 * - Admins: Can both trash and permanently delete
 */
export const DifferentiatedTrash: CollectionConfig = {
  slug: differentiatedTrashSlug,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    delete: ({ req: { user }, data }) => {
      // Not logged in - no access
      if (!user) {
        return false
      }

      // Admins can do anything (trash or permanently delete)
      if (user.email?.includes('dev@')) {
        return true
      }

      // Regular users: check what operation they're attempting
      // If data.deletedAt is being set, it's a trash attempt - allow it
      if (data?.deletedAt) {
        return true
      }

      // Otherwise it's a permanent delete attempt - deny for regular users
      return false
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
