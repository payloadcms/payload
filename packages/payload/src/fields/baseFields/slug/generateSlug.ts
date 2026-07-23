import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { getSlugFallbackValue } from './getSlugFallbackValue.js'
import { hasValue } from './hasValue.js'

type Args = {
  localized?: boolean
  name: string
  slugify?: Slugify
  useAsSlug: string
}

/**
 * `beforeChange` hook for the native `slug` field. Fills the slug only while empty and never rewrites
 * one that's set, so a lagging autosave can't clobber it with a stale value:
 *   - explicit input and the source field are slugified, e.g. "Hello World" → "hello-world"
 *   - an already-set slug is preserved as-is
 *   - empty with no source falls back to `<singular>-<N>` (see {@link getSlugFallbackValue})
 *
 * The fallback is skipped for globals (singletons) and localized slugs (per-locale uniqueness is
 * unresolved — see the slug block in field sanitization), which are left empty.
 */
export const generateSlug =
  ({ name, localized, slugify: customSlugify, useAsSlug }: Args): FieldHook =>
  async ({ collection, data, operation, originalDoc, req, value }) => {
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

    // Derive an empty slug from its source when present.
    const source = data?.[useAsSlug]

    if (source) {
      return await slugify(source)
    }

    // No source: keep a stored value, otherwise fall back to `<singular>-<N>`.
    if (hasValue(storedSlug)) {
      return storedSlug
    }

    if (!collection || localized) {
      return undefined
    }

    return await getSlugFallbackValue({ collection, field: name, req, slugify })
  }
