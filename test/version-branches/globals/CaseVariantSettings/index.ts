import type { GlobalConfig } from 'payload'

import { caseVariantSettingsSlug } from '../../slugs.js'

export const CaseVariantSettings: GlobalConfig = {
  slug: caseVariantSettingsSlug,
  access: { read: () => true, update: () => true },
  fields: [
    { name: 'title', type: 'text', localized: true },
    { name: 'caseLocation', type: 'point', index: true },
  ],
}
