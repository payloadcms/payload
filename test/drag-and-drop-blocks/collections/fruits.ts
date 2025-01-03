import type { Block, CollectionConfig } from 'payload'

function createFruitBlock(slug: string, name: string): Block {
  return {
    slug,
    fields: [
      {
        type: 'text',
        name: `${name}Type`,
      },
      { name: `seed${name}`, type: 'relationship', relationTo: 'seeds', hasMany: true },
    ],
  }
}

export const Fruits: CollectionConfig = {
  versions: {
    drafts: { autosave: true },
  },
  slug: 'fruits',
  fields: [
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        createFruitBlock('apples', 'Apple'),
        createFruitBlock('pears', 'Pear'),
        createFruitBlock('oranges', 'Orange'),
      ],
    },
  ],
}

export const Seeds: CollectionConfig = {
  admin: {
    useAsTitle: 'name',
  },
  slug: 'seeds',
  fields: [
    {
      type: 'text',
      name: 'name',
    },
  ],
}
