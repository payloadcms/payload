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
      // Autosave drafts: do not auto-generate on the initial draft — the user is still
      // entering content. Keep an explicitly provided slug; generation begins on a later autosave.
      if (hasAutosaveEnabled(entity) && data?._status === 'draft') {
        return value || null
      }
      // Keep an explicitly provided slug; otherwise generate from the source.
      return await run(value || source)
    }

    const originalSlug = originalDoc?.[name]
    const originalSource = originalDoc?.[useAsSlug]

    // Explicit edit this save (a value was sent that differs from what is stored): respect it.
    // Includes an intentional clear (empty string / null), matching the field's prior semantics.
    if (value !== undefined && value !== originalSlug) {
      return value
    }

    // The admin did not touch the slug. If a stored slug no longer matches its
    // source-derived value, it was edited by hand — freeze it.
    if (originalSlug && originalSlug !== (await slugify(originalSource))) {
      return originalSlug
    }

    if (!hasAutosaveEnabled(entity)) {
      // Non-autosave: generate once while empty, then freeze.
      return originalSlug || (await slugify(source))
    }

    // Autosave / drafts.
    const priorVersions = await countVersions({
      collectionSlug: collection?.slug,
      globalSlug: global?.slug,
      parentID: originalDoc?.id,
      req,
    })

    // Requirement 1: do not generate on the very first draft (no prior version yet).
    if (priorVersions === 0) {
      return originalSlug ?? null
    }

    // Stabilize after publish to protect live URLs.
    if (data?._status === 'published' || originalDoc?._status === 'published') {
      return originalSlug
    }

    // Still auto-tracking an unpublished draft with content.
    return source ? await slugify(source) : null
  }
