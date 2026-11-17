import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { containersSlug, foldersSlug, postsSlug } from '../../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  access: {
    read: ({ req }) =>
      req.context.denyPosts
        ? false
        : req.context.denyPostID
          ? { id: { not_equals: req.context.denyPostID } }
          : true,
  },
  admin: { baseFilter: () => ({ hidden: { not_equals: true } }), useAsTitle: 'headline' },
  fields: [
    { name: 'headline', type: 'text', access: { read: ({ req }) => !req.context.denyPostTitles } },
    { name: 'hidden', type: 'checkbox' },
    { name: 'secret', type: 'text', access: { read: () => false } },
    createFolderField({ relationTo: containersSlug }),
    createFolderField({ relationTo: foldersSlug }),
  ],
}
