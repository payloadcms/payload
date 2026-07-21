import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { hasAutosaveEnabled } from '../../../utilities/getVersionsConfig.js'
import { slugify as defaultSlugify } from '../../../utilities/slugify.js'

type Args = {
  name: string
  slugify?: Slugify
  useAsSlug: string
}

/**
 * Field `beforeChange` hook for the native `slug` field. Returns the slug value.
 * - The slug value is derived from the `useAsSlug` source field,
 *   but can be manually overridden by the admin.
 * - To protect live URLs, the slug is frozen after initial generation
 *   unless the admin explicitly overwrites it.
 *
 * This is expressed as follows:
 *
 * Non-versioned and versioned-but-non-autosave collections:
 * - On create, generate from the source, keeping an explicitly provided value.
 * - On update, regenerate only while the stored slug is empty.
 * - Freeze on the first non-empty value, whether generated or manually provided.
 *
 * Autosave drafts:
 * - On every draft save (create and autosave) before publish, generate freely — a new
 *   document gets a natural, live-updating slug while the admin is still entering content.
 * - Freeze on the first manual overwrite or the first publish. A mid-draft overwrite wins
 *   immediately and is preserved across later autosaves.
 */
export const generateSlug =
  ({ name, slugify: customSlugify, useAsSlug }: Args): FieldHook =>
  async ({ collection, data, global, operation, originalDoc, req, value }) => {
    const source = data?.[useAsSlug]

    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data: (data ?? {}) as TypeWithID, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    const entity = collection || global!

    if (operation === 'create') {
      // Generate from the source (keeping an explicitly provided slug). On an autosave
      // collection the initial draft is created empty, so this yields an empty slug and
      // begins tracking as soon as content is entered.
      return await slugify(value || source)
    }

    const storedSlug = originalDoc?.[name]
    const originalSource = originalDoc?.[useAsSlug]

    // User explicitly edited the slug (or cleared the value) this save: respect it.
    if (value !== undefined && value !== storedSlug) {
      return value
    }

    // No explicit edit this save. If the stored slug doesn't match what its source
    // would generate, it was customized on an earlier save — keep it frozen.
    const storedSlugIsCustom = storedSlug && storedSlug !== (await slugify(originalSource))

    if (storedSlugIsCustom) {
      return storedSlug
    }

    if (!hasAutosaveEnabled(entity)) {
      // Non-autosave: generate once while empty, then freeze.
      return storedSlug || (await slugify(source))
    }

    // Autosave drafts: freeze once the document has been published to protect the live URL.
    if (data?._status === 'published' || originalDoc?._status === 'published') {
      return storedSlug
    }

    // Still an unpublished draft — keep tracking the source freely.
    return source ? await slugify(source) : null
  }
