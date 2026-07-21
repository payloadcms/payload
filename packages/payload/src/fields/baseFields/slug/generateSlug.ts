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
 *
 * Auto-tracking is derived statelessly — there is no persisted "generate" flag.
 * The slug follows its source while it is empty or still equals `slugify(storedSource)`;
 * once it diverges (the admin overwrites it) it freezes, and stays frozen because the
 * stored value keeps differing from `slugify(source)`. Re-aligning (the UI generate
 * button) resumes tracking.
 *
 * Autosave drafts:
 * - The slug generates **freely on every draft save** (create and autosave) so a new
 *   document gets a natural, live-updating slug while the admin is still entering content.
 * - It **freezes on the first publish** (and on every save thereafter) to protect the
 *   now-live URL from silently changing.
 * - A manual overwrite mid-draft wins immediately and is preserved across later
 *   autosaves via the stateless latch above — publish is not required to lock a custom value.
 *
 * This intentionally does **not** gate generation on version count. "Free until first
 * publish, unless manually overwritten" is expressed purely from `_status` and the
 * stored-vs-source comparison, which is both simpler and correct regardless of how many
 * draft versions have accumulated.
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
