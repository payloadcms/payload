/* eslint-disable no-restricted-exports */

import { autoDedupeBlocksPlugin } from '../__helpers/shared/autoDedupeBlocksPlugin/index.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { baseConfig, seed } from './baseConfig.js'

export default buildConfigWithDefaults({
  suite: 'fields-blockreferences',
  config: {
    ...baseConfig,
    plugins: [autoDedupeBlocksPlugin({ silent: true })],
  },
  seed,
})
