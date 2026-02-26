import type { GlobalConfig } from 'payload'

import { customGlobalDocumentControlsSlug } from '../slugs.js'

export const GlobalCustomDocumentControls: GlobalConfig = {
  slug: customGlobalDocumentControlsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
