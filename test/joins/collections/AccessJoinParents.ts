import type { CollectionConfig } from 'payload'

import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from '../shared.js'

export const AccessJoinParents: CollectionConfig = {
  slug: accessJoinParentsSlug,
  fields: [
    {
      name: 'children',
      type: 'join',
      collection: [accessJoinArticlesSlug, accessJoinNotesSlug],
      on: 'parent',
    },
    {
      name: 'articles',
      type: 'join',
      collection: accessJoinArticlesSlug,
      on: 'parent',
    },
  ],
}
