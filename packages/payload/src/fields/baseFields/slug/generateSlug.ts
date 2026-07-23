import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { consumeSlugDuplicateFallback } from './duplicateContext.js'
import { hasValue } from './hasValue.js'

type Args = {
  name: string
  slugify?: Slugify
  useAsSlug: string
}

/**
 * `beforeChange` hook for the native `slug` field. Fills the slug only while it's empty and never
 * rewrites one that's set, so a lagging autosave response can't clobber it with a stale value.
 *
 * Explicit input and source values are run through the field's slugify; a stored slug is returned
 * as-is (re-slugifying would mutate it behind the client's back and could corrupt a custom-slugify
 * value). An empty slug with no source is left for the id fallback in {@link generateSlugIdFallback}.
 */
export const generateSlug =
  ({ name, slugify: customSlugify, useAsSlug }: Args): FieldHook =>
  async ({ context, data, operation, originalDoc, req, value }) => {
    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data: (data ?? {}) as TypeWithID, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    // Explicit value from the client wins — normalized through the field's slugify.
    if (hasValue(value)) {
      return await slugify(value)
    }

    const storedSlug = originalDoc?.[name]

    // On update, preserve a slug that is already set — only fill it while empty.
    if (operation !== 'create' && hasValue(storedSlug)) {
      return storedSlug
    }

    // On a duplicate, skip source derivation so the copy falls back to its own new id. See generateSlugBeforeDuplicate.
    if (consumeSlugDuplicateFallback(context, name)) {
      return undefined
    }

    // Derive an empty slug from its source when present; otherwise leave it empty
    // (on create, the id fallback in afterChange backfills it).
    const source = data?.[useAsSlug]

    if (!source) {
      return storedSlug ?? undefined
    }

    return await slugify(source)
  }
