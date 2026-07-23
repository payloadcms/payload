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
 * `beforeChange` hook for the native `slug` field. Fills the slug only while empty and never rewrites
 * one that's set, so a lagging autosave can't clobber it with a stale value:
 *   - explicit input and the source field are slugified, e.g. "Hello World" → "hello-world"
 *   - an already-set slug is preserved as-is
 *   - empty with no source is left for the id fallback (see {@link generateSlugIdFallback})
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

    // On duplicate, skip source derivation so the copy falls back to the new doc id. See generateSlugBeforeDuplicate.
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
