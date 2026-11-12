/* eslint-disable no-restricted-exports */

import { autoDedupeBlocksPlugin } from '../__helpers/shared/autoDedupeBlocksPlugin/index.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { baseConfig, seed } from './baseConfig.js'
import { blockFieldsSlug } from './slugs.js'

export default buildConfigWithDefaults({
  config: {
    ...baseConfig,
    collections: baseConfig.collections?.map((collection) =>
      collection.slug === blockFieldsSlug
        ? {
            ...collection,
            // The plugin rejects the same slug with different inline and global schemas;
            // keep this collision fixture in the ordinary fields suite only.
            fields: collection.fields.filter(
              (field) => !('name' in field && field.name === 'sharedBlocks'),
            ),
          }
        : collection,
    ),
    plugins: [autoDedupeBlocksPlugin({ silent: true })],
  },
  seed,
  suite: 'fields-blockreferences',
})
