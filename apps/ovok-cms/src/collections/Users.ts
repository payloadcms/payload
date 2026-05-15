import type { CollectionConfig } from 'payload'

import { ovokInternalStrategy } from '../access/ovokInternal'

/**
 * Required by Payload (admin.user must reference a collection). Never
 * populated — authn comes entirely from Ovok via the internal strategy.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: true,
    strategies: [ovokInternalStrategy],
  },
  access: {
    read: () => true,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [{ name: 'email', type: 'email' }],
}
