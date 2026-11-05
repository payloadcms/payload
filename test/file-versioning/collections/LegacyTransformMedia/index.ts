import type { CollectionConfig } from 'payload'

import { legacyMediaDir, legacyMediaSlug } from '../../shared.js'

// The seed saves documents here the way they looked before `_transforms` existed.
export const LegacyTransformMedia: CollectionConfig = {
  slug: legacyMediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  labels: { plural: 'Legacy Media', singular: 'Legacy Media' },
  upload: { adminThumbnail: 'small', staticDir: legacyMediaDir },
  versions: { maxPerDoc: 2 },
}
