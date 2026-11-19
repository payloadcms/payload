import type { CollectionConfig } from 'payload'

import { draftJoinNotesSlug, draftJoinProjectsSlug, draftJoinWorkspacesSlug } from '../shared.js'

export const DraftJoinNotes: CollectionConfig = {
  slug: draftJoinNotesSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', localized: true },
    { name: 'workspace', type: 'relationship', relationTo: draftJoinWorkspacesSlug },
    {
      name: 'project',
      type: 'relationship',
      relationTo: draftJoinProjectsSlug,
    },
  ],
}
