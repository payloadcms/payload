import type { CollectionConfig } from 'payload'

import { pointFieldsOptimizedSlug } from '../../slugs.js'

// No localized/hasMany/blocks/array fields here on purpose - collections shaped like
// this take the `shouldUseOptimizedUpsertRow` fast path in packages/drizzle/src/upsertRow.
const PointFieldsOptimized: CollectionConfig = {
  slug: pointFieldsOptimizedSlug,
  fields: [
    {
      name: 'point',
      type: 'point',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: false,
}

export default PointFieldsOptimized
