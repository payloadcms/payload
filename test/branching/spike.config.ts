import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { antiJoinProbeSlug, latestProbeSlug, sentinelProbeSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Phase 0 spike config.
 *
 * Deliberately uses only features Payload already ships. Its purpose is to
 * verify the assumptions the branching design rests on *before* any core
 * changes are built on top of them — see CONTENT_BRANCHING_PLAN.md §19.
 */
export default buildConfigWithDefaults({
  collections: [
    {
      // Assumption 1 (§5a): `not_in` against a hasMany field is unsafe on
      // relational adapters, which is why shadow tracking cannot use an array.
      slug: antiJoinProbeSlug,
      fields: [
        { name: 'title', type: 'text' },
        { name: 'shadowedBy', type: 'text', hasMany: true },
      ],
      versions: false,
    },
    {
      // Assumption 2 (§3): a compound unique index scoped by a non-null
      // sentinel enforces uniqueness identically across all three databases.
      slug: sentinelProbeSlug,
      fields: [
        { name: 'slug', type: 'text' },
        { name: 'branch', type: 'text', defaultValue: 'main' },
      ],
      indexes: [{ fields: ['slug', 'branch'], unique: true }],
      versions: false,
    },
    {
      // Assumption 3 (§7): `latest` on collection versions is scoped by
      // `parent`, so two parents each keep their own latest version. This is
      // what lets branch shadow rows carry independent version chains with no
      // change to versions at all.
      slug: latestProbeSlug,
      fields: [{ name: 'title', type: 'text' }],
      versions: { drafts: true },
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
