import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { CTABlock } from '../blocks/CTABlock.js'
import { GalleryBlock } from '../blocks/GalleryBlock.js'
import { HeroBlock } from '../blocks/HeroBlock.js'
import { articlesSlug } from '../slugs.js'

export const Articles: CollectionConfig = {
  slug: articlesSlug,
  admin: {
    useAsTitle: 'title',
  },
  templates: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [HeroBlock, CTABlock, GalleryBlock],
      templates: true,
    },
    {
      name: 'tags',
      type: 'array',
      templates: true,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
