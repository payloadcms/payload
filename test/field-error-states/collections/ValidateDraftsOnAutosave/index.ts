import type { CollectionConfig } from 'payload'

import { collectionSlugs } from '../../shared.js'
import { ValidateDraftsOn } from '../ValidateDraftsOn/index.js'

export const ValidateDraftsOnAndAutosave: CollectionConfig = {
  ...ValidateDraftsOn,
  slug: collectionSlugs.validateDraftsOnAutosave,
  versions: {
    drafts: {
      autosave: true,
      validate: true,
    },
  },
}
