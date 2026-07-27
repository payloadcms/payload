import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { hasAutosaveEnabled } from '../../../utilities/getVersionsConfig.js'
import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { countVersions } from './countVersions.js'

type Args = {
  name: string
  slugify?: Slugify
  useAsSlug: string
}

/**
 * Field `beforeChange` hook for the native `slug` field. Returns the slug value.
 *
 * Auto-tracking is derived statelessly: the slug follows its source while it is
 * empty or still equals `slugify(storedSource)`. Once it diverges (the admin
 * overwrites it), it freezes — and stays frozen, because the stored value keeps
 * differing from `slugify(source)`. Re-aligning (the UI generate button) resumes
 * tracking.
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
      // Autosave drafts: do not auto-generate on the initial draft — the user is still entering content.
      // Keep the explicit non-slugified value (if any); generation begins on a later autosave.
      if (hasAutosaveEnabled(entity) && data?._status === 'draft') {
        // Leave an empty slug absent rather than `null`: the field's unique index is sparse, which
        // skips missing values but not `null`, so multiple empty autosave drafts would otherwise
        // collide on the unique constraint.
        return value || undefined
      }

      // Keep an explicitly provided slug; otherwise generate from the source.
      return await slugify(value || source)
    }

    const storedSlug = originalDoc?.[name]
    const originalSource = originalDoc?.[useAsSlug]

    // User explicitly edited the slug (or cleared the value): respect it.
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

    // Autosave / drafts
    const priorVersions = await countVersions({
      collectionSlug: collection?.slug,
      globalSlug: global?.slug,
      parentID: originalDoc?.id,
      req,
    })

    // Do not generate on the very first draft (no prior version yet).
    if (priorVersions === 0) {
      return storedSlug ?? undefined
    }

    // Stabilize after publish to protect live URLs.
    if (data?._status === 'published' || originalDoc?._status === 'published') {
      return storedSlug
    }

    // Still auto-tracking an unpublished draft with content.
    return source ? await slugify(source) : undefined
  }
