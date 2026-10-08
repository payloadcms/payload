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
      if (context?.restoreAccessMode === 'allow') {
        return true
      }

      if (context?.restoreAccessMode === 'deny') {
        return false
      }

      // Publish gate: a non-publisher may not set the global to published.
      if (context?.restoreAccessMode === 'publishGate') {
        return data?._status !== 'published'
      }

      // Unpublish gate: a non-publisher may not set the global to draft.
      if (context?.restoreAccessMode === 'unpublishGate') {
        return data?._status !== 'draft'
      }

      // Constrained: only allow when the current global is unlocked.
      // Uses `equals` because it filters consistently across all database
      // adapters (relational `not_equals` has NULL/text semantics that differ
      // from MongoDB).
      return { title: { equals: 'unlocked' } }
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
