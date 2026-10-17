import type { Block } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { pagesSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * The named tab keeps the SQL adapters from judging the block's placements identical, so each placement gets a table
 * of its own, numbered in the order the config walks them
 */
const Card: Block = {
  slug: 'card',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'styles',
          fields: [
            {
              name: 'tone',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}

/** Offers `Card` inside its rows, walked before the top-level placement */
const Grid: Block = {
  slug: 'grid',
  fields: [
    {
      name: 'columns',
      type: 'array',
      fields: [
        {
          name: 'content',
          type: 'blocks',
          blocks: [Card],
        },
      ],
    },
  ],
}

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: pagesSlug,
        access: {
          create: () => true,
          read: () => true,
          update: () => true,
        },
        fields: [
          {
            name: 'content',
            type: 'blocks',
            blocks: [Grid, Card],
          },
        ],
      },
    ],
  },
  suite: 'block-table-variants',
})
