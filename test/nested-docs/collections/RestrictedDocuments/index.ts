import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { foldersSlug, restrictedDocumentsSlug } from '../../shared.js'

export const RestrictedDocuments: CollectionConfig = {
  slug: restrictedDocumentsSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text' },
    { ...createFolderField({ relationTo: foldersSlug }), access: { read: () => false } },
  ],
}
