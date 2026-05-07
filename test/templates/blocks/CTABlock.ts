import type { Block } from 'payload'

import { ctaBlockSlug } from '../slugs.js'

export const CTABlock: Block = {
  slug: ctaBlockSlug,
  interfaceName: 'CTABlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
    },
    {
      name: 'buttonUrl',
      type: 'text',
      required: true,
    },
  ],
}
