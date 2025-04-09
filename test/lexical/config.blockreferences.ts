/* eslint-disable no-restricted-exports */

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { autoDedupeBlocksPlugin } from '../helpers/autoDedupeBlocksPlugin/index.js'
import { baseConfig } from './baseConfig.js'
import { lexicalBlocks, lexicalInlineBlocks } from './collections/Lexical/index.js'

export default buildConfigWithDefaults({
  ...baseConfig,
  blocks: [
    ...(baseConfig.blocks ?? []),
    ...lexicalBlocks.filter((block) => typeof block !== 'string'),
    ...lexicalInlineBlocks.filter((block) => typeof block !== 'string'),
  ],
  plugins: [autoDedupeBlocksPlugin({ silent: false })],
})
