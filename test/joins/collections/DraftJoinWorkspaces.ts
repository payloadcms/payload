import type { CollectionConfig } from 'payload'

import { draftJoinArticlesSlug, draftJoinNotesSlug, draftJoinWorkspacesSlug } from '../shared.js'

export const DraftJoinWorkspaces: CollectionConfig = {
  slug: draftJoinWorkspacesSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'documents',
      type: 'join',
      collection: [draftJoinArticlesSlug, draftJoinNotesSlug],
      on: 'workspace',
    },
  ],
}
