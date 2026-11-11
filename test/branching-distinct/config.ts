import { branchChangesCollectionSlug } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Articles, Authors, Organizations } from './collections/index.js'
import { articlesSlug, authorsSlug, organizationsSlug } from './shared.js'

const config = await buildConfigWithDefaults({
  suite: 'branching-distinct',
  disableMCP: true,
  config: {
    collections: [
      Articles,
      Authors,
      Organizations,
      {
        slug: branchChangesCollectionSlug,
        fields: [
          { name: 'branch', type: 'text' },
          { name: 'collectionSlug', type: 'text' },
          { name: 'documentID', type: 'text' },
          { name: 'entityType', type: 'text' },
          { name: 'operation', type: 'text' },
          { name: 'baseVersionID', type: 'text' },
          { name: 'baseVersionUpdatedAt', type: 'date' },
        ],
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'es'] },
    typescript: { autoGenerate: false },
  },
})

// This adapter layer precedes registration of the internal branching collections.
config.branching = {
  enabled: true,
  branchableCollections: new Set([articlesSlug, authorsSlug, organizationsSlug]),
  branchableGlobals: new Set(),
  validate: () => ({ errors: [], valid: true }),
}

export default config
