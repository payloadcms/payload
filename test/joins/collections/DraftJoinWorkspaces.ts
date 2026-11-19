import type { CollectionConfig } from 'payload'

import { draftJoinArticlesSlug, draftJoinNotesSlug, draftJoinWorkspacesSlug } from '../shared.js'

export const DraftJoinWorkspaces: CollectionConfig = {
  slug: draftJoinWorkspacesSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'documents',
      access: {
        read: ({ doc, req }) =>
          !req.context.hideWorkspaceMembership || doc?.title === 'Visible workspace',
      },
      type: 'join',
      collection: [draftJoinArticlesSlug, draftJoinNotesSlug],
      on: 'workspace',
    },
  ],
}
