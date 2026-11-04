import type { CollectionConfig } from 'payload'

import { pointVersionsCollectionSlug } from '../slugs.js'

/**
 * Only main-table columns + a point so Postgres updates take the `UPDATE ... RETURNING` path in upsertRow
 */
export const PointVersions: CollectionConfig = {
  slug: pointVersionsCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'point',
      type: 'point',
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 30,
  },
}
