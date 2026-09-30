import type { Block, BlockSlug } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const leafBlockSlug = 'cache-leaf'
export const leftBlockSlug = 'cache-left'
export const rightBlockSlug = 'cache-right'
export const rootBlockSlug = 'cache-root'
export const numericTargetsSlug = 'numeric-targets'
export const pagesSlug = 'schema-cache-pages'

export const leafBlock: Block = {
  slug: leafBlockSlug,
  fields: [
    { name: 'value', type: 'text', required: true },
    { name: 'localizedText', type: 'text', localized: true },
    { name: 'uniqueText', type: 'text', unique: true },
    { name: 'location', type: 'point' },
    { name: 'target', type: 'relationship', relationTo: numericTargetsSlug },
  ],
}

export const leftBlock: Block = {
  slug: leftBlockSlug,
  fields: [
    {
      name: 'leaves',
      type: 'blocks',
      blocks: [leafBlockSlug as BlockSlug],
    },
  ],
}

export const rightBlock: Block = {
  slug: rightBlockSlug,
  fields: [
    {
      name: 'leaves',
      type: 'blocks',
      blocks: [leafBlockSlug as BlockSlug],
    },
  ],
}

export const rootBlock: Block = {
  slug: rootBlockSlug,
  fields: [
    {
      name: 'branches',
      type: 'blocks',
      blocks: [leftBlockSlug as BlockSlug, rightBlockSlug as BlockSlug],
    },
  ],
}

export const referencedBlocks = [leafBlock, leftBlock, rightBlock, rootBlock]

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    blocks: referencedBlocks,
    collections: [
      {
        slug: numericTargetsSlug,
        fields: [
          { name: 'id', type: 'number', required: true },
          { name: 'title', type: 'text', required: true },
        ],
      },
      {
        slug: pagesSlug,
        fields: [
          { name: 'title', type: 'text', required: true },
          {
            name: 'layout',
            type: 'blocks',
            blocks: [rootBlockSlug as BlockSlug],
          },
          {
            name: 'localizedLayout',
            type: 'blocks',
            blocks: [rootBlockSlug as BlockSlug],
            localized: true,
          },
        ],
        versions: {
          drafts: true,
        },
      },
    ],
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'de'],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  suite: 'mongodb-schema-build-cache',
})
