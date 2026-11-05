import type { GlobalConfig } from 'payload'

import { simpleDraftGlobalSlug } from '../slugs.js'

const SimpleDraftGlobal: GlobalConfig = {
  slug: simpleDraftGlobalSlug,
  label: 'Simple Draft Global',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}

export default SimpleDraftGlobal
