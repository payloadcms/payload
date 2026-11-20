import type { CollectionConfig } from 'payload'

import { draftJoinArticlesSlug, draftJoinNotesSlug, draftJoinProjectsSlug } from '../shared.js'

export const DraftJoinProjects: CollectionConfig = {
  slug: draftJoinProjectsSlug,
  versions: { drafts: true },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'documents',
      type: 'join',
      collection: [draftJoinArticlesSlug, draftJoinNotesSlug],
      on: 'project',
    },
  ],
}
