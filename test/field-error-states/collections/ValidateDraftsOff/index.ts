import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { slugs } from '../../shared'
import { ValidateDraftsOn } from '../ValidateDraftsOn'

export const ValidateDraftsOff: CollectionConfig = {
  ...ValidateDraftsOn,
  slug: slugs.validateDraftsOff,
  versions: {
    drafts: true,
  },
}
