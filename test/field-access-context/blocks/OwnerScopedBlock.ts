import type { Block } from 'payload'

import { ownerScopedBlockSlug } from '../shared.js'

/**
 * Used by reference in a collection and in a global, so both share one block reference
 */
export const OwnerScopedBlock: Block = {
  slug: ownerScopedBlockSlug,
  fields: [
    {
      name: 'globalOnlyProbe',
      type: 'text',
      access: {
        read: ({ global }) => Boolean(global),
      },
    },
  ],
}
