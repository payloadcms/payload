/* eslint-disable no-restricted-exports */

import { autoDedupeBlocksPlugin } from '../__helpers/shared/autoDedupeBlocksPlugin/index.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { baseConfig } from './baseConfig.js'
import { blockFieldsSlug } from './slugs.js'

export default buildConfigWithDefaults({
  ...baseConfig,
  collections: baseConfig.collections?.map((collection) =>
    collection.slug === blockFieldsSlug
      ? {
          ...collection,
          fields: collection.fields.filter(
            (field) => !('name' in field && field.name === 'inlineCollisionBlocks'),
          ),
        }
      : collection,
  ),
  plugins: [autoDedupeBlocksPlugin({ silent: true })],
})
