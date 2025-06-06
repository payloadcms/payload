import type { CollectionConfig } from 'payload'

export const pagesSlug = 'pages'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    delete: ({ req: { user } }) => {
      // Allow delete access if the user has the 'is_admin' role
      return Boolean(user?.roles?.includes('is_admin'))
    },
  },
  softDeletes: true,
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
