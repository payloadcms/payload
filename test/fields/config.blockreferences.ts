/* eslint-disable no-restricted-exports */

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { autoDedupeBlocksPlugin } from '../__helpers/shared/autoDedupeBlocksPlugin/index.js'
import { baseConfig } from './baseConfig.js'

export default buildConfigWithDefaults({
  ...baseConfig,
  plugins: [autoDedupeBlocksPlugin({ silent: true })],
})
