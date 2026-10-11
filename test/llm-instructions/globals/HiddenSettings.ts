import type { GlobalConfig } from 'payload'

import { hiddenGlobalSlug } from '../slugs.js'

export const HiddenSettings: GlobalConfig = {
  slug: hiddenGlobalSlug,
  admin: { hidden: true },
  fields: [],
  llmInstructions: 'Preserve hidden settings.',
}
