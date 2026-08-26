import type { Block, CollectionConfig } from 'payload'

const HeroBlock: Block = {
  slug: 'hero',
  fields: [],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      blockReferences: ['content', HeroBlock],
      blocks: [],
    },
    {
      name: 'sidebar',
      type: 'blocks',
      blockReferences: ['cta'],
    },
  ],
}
