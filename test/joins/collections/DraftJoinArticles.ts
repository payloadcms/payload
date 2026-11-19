import type { CollectionConfig } from 'payload'

import { draftJoinArticlesSlug, draftJoinProjectsSlug, draftJoinWorkspacesSlug } from '../shared.js'

export const DraftJoinArticles: CollectionConfig = {
  slug: draftJoinArticlesSlug,
  versions: { drafts: true },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', localized: true },
    { name: 'tags', type: 'select', hasMany: true, options: ['included', 'excluded'] },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: draftJoinWorkspacesSlug,
      access: { read: ({ req }) => !req.context.hideWorkspaceMembership },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: draftJoinProjectsSlug,
      draftJoinWorkspacesSlug,
    },
  ],
}
