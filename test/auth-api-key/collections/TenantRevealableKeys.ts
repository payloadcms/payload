import type { CollectionConfig } from 'payload'

import { tenantRevealableKeysSlug } from '../shared.js'

export const TenantRevealableKeys: CollectionConfig = {
  slug: tenantRevealableKeysSlug,
  access: {
    read: () => true,
    // Data-based access mirroring a common multi-tenant pattern. Reveal must
    // evaluate this against the stored document, not an empty payload.
    update: ({ req, data }) => Boolean(req.user) && data?.tenant === 'match',
  },
  auth: {
    disableLocalStrategy: true,
    useAPIKey: { reveal: true },
  },
  fields: [
    {
      name: 'tenant',
      type: 'text',
    },
  ],
}
