import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { CTABlock } from '../blocks/CTABlock.js'
import { GalleryBlock } from '../blocks/GalleryBlock.js'
import { HeroBlock } from '../blocks/HeroBlock.js'
import { pagesSlug } from '../slugs.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
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
      name: 'content',
      type: 'blocks',
      blocks: [HeroBlock, CTABlock, GalleryBlock],
    },
  ],
}
