import type { GlobalConfig } from 'payload'

import { restoreAccessGlobalSlug, restoreAccessNoVersionsGlobalSlug } from '../slugs.js'

const updateAccess: NonNullable<GlobalConfig['access']>['update'] = ({ req: { context } }) => {
  if (context?.restoreAccessMode === 'allow') {
    return true
  }

  if (context?.restoreAccessMode === 'deny') {
    return false
  }

  // Constrained: only allow when the current global is unlocked. `equals`
  // filters consistently across adapters, unlike relational NULL/text cases.
  return { title: { equals: 'unlocked' } }
}

const fields: GlobalConfig['fields'] = [
  {
    name: 'title',
    type: 'text',
    required: true,
  },
]

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
    update: updateAccess,
  },
  fields,
  versions: {
    drafts: true,
  },
}

export const RestoreAccessNoVersionsGlobal: GlobalConfig = {
  slug: restoreAccessNoVersionsGlobalSlug,
  access: { update: updateAccess },
  fields,
}

export default RestoreAccessGlobal
