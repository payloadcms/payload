import { branchChangesCollectionSlug } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Children, Notes, Parents } from './collections/index.js'
import { childrenSlug, notesSlug, parentsSlug } from './shared.js'

const config = await buildConfigWithDefaults({
  suite: 'branching-adapter-queries',
  disableMCP: true,
  config: {
    collections: [
      Parents,
      Children,
      Notes,
      {
        slug: branchChangesCollectionSlug,
        fields: [
          { name: 'branch', type: 'text' },
          { name: 'collectionSlug', type: 'text' },
          { name: 'documentID', type: 'text' },
          { name: 'entityType', type: 'text' },
          { name: 'operation', type: 'text' },
        ],
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'es'] },
  },
})

// This adapter layer precedes registration of the internal branching collections.
config.branching = {
  enabled: true,
  branchableCollections: new Set([childrenSlug, notesSlug, parentsSlug]),
  branchableGlobals: new Set(),
  validate: () => ({ errors: [], valid: true }),
}

export default config
