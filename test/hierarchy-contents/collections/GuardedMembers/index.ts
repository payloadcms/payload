import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { containersSlug, guardedMembersSlug } from '../../shared.js'

export const GuardedMembers: CollectionConfig = {
  slug: guardedMembersSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text' },
    { ...createFolderField({ relationTo: containersSlug }), access: { read: () => true } },
  ],
}
