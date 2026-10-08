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
      blockReferences: [leafBlockSlug as BlockSlug],
      blocks: [],
    },
  ],
}

export const rightBlock: Block = {
  slug: rightBlockSlug,
  fields: [
    {
      name: 'leaves',
      type: 'blocks',
      blockReferences: [leafBlockSlug as BlockSlug],
      blocks: [],
    },
  ],
}

export const rootBlock: Block = {
  slug: rootBlockSlug,
  fields: [
    {
      name: 'branches',
      type: 'blocks',
      blockReferences: [leftBlockSlug as BlockSlug, rightBlockSlug as BlockSlug],
      blocks: [],
    },
  ],
}

export const referencedBlocks = [leafBlock, leftBlock, rightBlock, rootBlock]

export default buildConfigWithDefaults({
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
          blockReferences: [rootBlockSlug as BlockSlug],
          blocks: [],
        },
        {
          name: 'localizedLayout',
          type: 'blocks',
          blockReferences: [rootBlockSlug as BlockSlug],
          blocks: [],
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
})
