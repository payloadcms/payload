/* eslint-disable no-restricted-exports */
import type { BlockSlug } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { autoDedupeBlocksPlugin } from '../helpers/autoDedupeBlocksPlugin/index.js'
import { baseConfig } from './baseConfig.js'
import {
  getLexicalFieldsCollection,
  lexicalBlocks,
  lexicalInlineBlocks,
  lexicalWrapperBlocks,
} from './collections/Lexical/index.js'
import { lexicalFieldsSlug } from './slugs.js'

export default buildConfigWithDefaults({
  ...baseConfig,
  blocks: [
    ...(baseConfig.blocks ?? []),
    ...lexicalBlocks.filter((block) => typeof block !== 'string'),
    ...lexicalInlineBlocks.filter((block) => typeof block !== 'string'),
  ],
  collections: baseConfig.collections?.map((collection) => {
    if (collection.slug === lexicalFieldsSlug) {
      return getLexicalFieldsCollection({
        blocks: lexicalBlocks.map((block) =>
          typeof block === 'string' ? block : block.slug,
        ) as BlockSlug[],
        inlineBlocks: lexicalInlineBlocks.map((block) =>
          typeof block === 'string' ? block : block.slug,
        ) as BlockSlug[],
        wrapperBlocks: lexicalWrapperBlocks.map((wrapperBlock) => ({
          createDOM: wrapperBlock.createDOM,
          block:
            typeof wrapperBlock.block === 'string'
              ? wrapperBlock.block
              : (wrapperBlock.block.slug as unknown as BlockSlug),
        })),
      })
    }
    return collection
  }),
  plugins: [autoDedupeBlocksPlugin({ silent: true })],
})
