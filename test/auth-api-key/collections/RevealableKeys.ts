import type { CollectionConfig } from 'payload'

import { revealableKeysSlug } from '../shared.js'

export const RevealableKeys: CollectionConfig = {
  slug: revealableKeysSlug,
  auth: {
    disableLocalStrategy: true,
    useAPIKey: { reveal: true },
  },
  fields: [],
}
