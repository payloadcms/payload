import type { CollectionConfig } from 'payload'

import { hiddenCollectionSlug } from '../slugs.js'

export const HiddenPages: CollectionConfig = {
  slug: hiddenCollectionSlug,
  admin: { hidden: true },
  fields: [],
  llmInstructions: 'Keep hidden pages private.',
}
