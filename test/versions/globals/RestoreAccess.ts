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
    update: ({ req: { context } }) => {
      if (context?.restoreAccessMode === 'allow') {
        return true
      }

      if (context?.restoreAccessMode === 'deny') {
        return false
      }

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
