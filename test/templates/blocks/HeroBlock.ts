import type { Block } from 'payload'

import { heroBlockSlug } from '../slugs.js'

export const HeroBlock: Block = {
  slug: heroBlockSlug,
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
    },
    {
      name: 'eyebrow',
      type: 'text',
    },
  ],
}
