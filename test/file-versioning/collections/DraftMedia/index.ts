import type { CollectionConfig } from 'payload'

import { draftMediaDir, draftMediaSlug } from '../../shared.js'

export const DraftMedia: CollectionConfig = {
  slug: draftMediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  upload: { filesRequiredOnCreate: false, staticDir: draftMediaDir },
  versions: { drafts: true },
}
