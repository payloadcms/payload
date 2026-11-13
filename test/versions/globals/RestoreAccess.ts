import type { GlobalConfig } from 'payload'

import { restoreAccessGlobalSlug, restoreAccessNoVersionsGlobalSlug } from '../slugs.js'

const buildRestoreAccessGlobal = (slug: string): GlobalConfig => ({
  slug,
  access: {
    readVersions: ({ req: { context } }) => {
      if (context?.readVersionsMode === 'constrained') {
        // Intentionally matches no version so restore must surface Forbidden.
        return { 'version.title': { equals: '__no_version_matches__' } }
      }

      return true
    },
    update: ({ data, req: { context } }) => {
      switch (context?.restoreAccessMode) {
        case 'allow':
          return true
        case 'deny':
          return false
        case 'idConstraint':
          return { id: { equals: context.restoreAccessGlobalID } }
        case 'publishGate':
          // Publish gate: a non-publisher may not set the global to published.
          return data?._status !== 'published'
        case 'unpublishGate':
          // Unpublish gate: a non-publisher may not set the global to draft.
          return data?._status !== 'draft'
        default:
          // Constrained: only allow when the current global is unlocked.
          // Uses `equals` because it filters consistently across all database
          // adapters (relational `not_equals` has NULL/text semantics that differ
          // from MongoDB).
          return { title: { equals: 'unlocked' } }
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
})

const RestoreAccessGlobal: GlobalConfig = {
  ...buildRestoreAccessGlobal(restoreAccessGlobalSlug),
  versions: {
    drafts: true,
  },
}

export const RestoreAccessNoVersionsGlobal = buildRestoreAccessGlobal(
  restoreAccessNoVersionsGlobalSlug,
)

export default RestoreAccessGlobal
