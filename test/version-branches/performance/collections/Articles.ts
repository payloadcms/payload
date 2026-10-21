import type { CollectionConfig } from 'payload'

import { performanceFields, performanceSlug } from '../scenarios.js'

export const PerformanceArticles: CollectionConfig = {
  slug: performanceSlug,
  fields: performanceFields,
  access: {
    read: ({ req }) => ({
      and: [
        { ordinal: { greater_than_equal: 0 } },
        ...(Array.isArray(req.context.performanceDeniedOrdinals)
          ? [{ ordinal: { not_in: req.context.performanceDeniedOrdinals } }]
          : []),
      ],
    }),
  },
  indexes: [{ fields: ['category', 'ordinal'] }],
  versions: { drafts: true, maxPerDoc: 0 },
}
