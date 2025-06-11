import type { CollectionConfig } from 'payload'

export const trashEnabledWithAccessControlSlug = 'trash-enabled-with-access-control'

export const TrashEnabledWithAccessControl: CollectionConfig = {
  slug: trashEnabledWithAccessControlSlug,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    delete: ({ req: { user } }) => {
      // Allow delete access if the user has the 'is_admin' role
      return Boolean(user?.roles?.includes('is_admin'))
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
