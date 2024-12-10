import type { CollectionConfig } from 'payload'

import { collectionSlugs } from '../../shared.js'
import { ValidateDraftsOn } from '../ValidateDraftsOn/index.js'

export const ValidateDraftsOff: CollectionConfig = {
  ...ValidateDraftsOn,
  slug: collectionSlugs.validateDraftsOff,
  versions: {
    drafts: true,
  },
}
