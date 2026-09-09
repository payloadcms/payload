import type { GlobalConfig } from 'payload'

import { restoreAccessGlobalSlug } from '../slugs.js'

/**
 * Global used to verify that version restore honors update-access query
 * constraints and read-version access. The access rules are driven by
 * `req.context` so a single global can exercise the `true`, `false`,
 * matching-Where, and non-matching-Where outcomes.
 */
const RestoreAccessGlobal: GlobalConfig = {
  slug: restoreAccessGlobalSlug,
  access: {
    readVersions: ({ req: { context } }) => {
      if (context?.readVersionsMode === 'constrained') {
        // Intentionally matches no version so restore must surface Forbidden.
        return { 'version.title': { equals: '__no_version_matches__' } }
      }

      return true
    },
    update: ({ req: { context } }) => {
      if (context?.restoreAccessMode === 'allow') {
        return true
      }

      if (context?.restoreAccessMode === 'deny') {
        return false
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
  versions: {
    drafts: true,
  },
}

export default RestoreAccessGlobal
