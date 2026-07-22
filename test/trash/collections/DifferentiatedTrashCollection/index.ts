import type { CollectionConfig } from 'payload'

export const differentiatedTrashCollectionSlug = 'differentiated-trash-collection'

/**
 * Captures the `id` argument received by the `delete` access control function
 * on the most recent invocation, so tests can assert it was passed through
 * for soft-delete (trash) attempts.
 */
export let lastDeleteAccessID: number | string | undefined

export const DifferentiatedTrashCollection: CollectionConfig = {
  slug: differentiatedTrashCollectionSlug,
  admin: {
    useAsTitle: 'title',
  },
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
  access: {
    delete: ({ id, req: { user }, data }) => {
      lastDeleteAccessID = id

      // Not logged in - no access
      if (!user) {
        return false
      }

      // Admins can do anything (trash or permanently delete)
      if (user.roles?.includes('is_admin')) {
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
