import type { CollectionConfig } from 'payload'

import { generateBlocks } from '../../blocks/index.js'

export const pagesSlug = 'pages'

export const PagesCollection: CollectionConfig = {
  slug: pagesSlug,
  access: {
    create: () => true,
    read: () => true,
  },
  fields: [
    {
      name: 'sections',
      label: 'Sections',
      type: 'blocks',
      blocks: generateBlocks(50, 25),
    },
  ],
}
