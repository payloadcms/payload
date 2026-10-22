import type { GlobalConfig } from 'payload'

import { articlesSlug, ordinarySettingsSlug } from '../../slugs.js'

export const buildOrdinarySettings = ({ hasPoint }: { hasPoint: boolean }): GlobalConfig => ({
  slug: ordinarySettingsSlug,
  access: { read: () => true, update: () => true },
  fields: [
    ...(hasPoint ? [{ name: 'location', type: 'point' as const, index: true }] : []),
    { name: 'title', type: 'text', localized: true },
    { name: 'related', type: 'relationship', relationTo: articlesSlug, localized: true },
  ],
})
