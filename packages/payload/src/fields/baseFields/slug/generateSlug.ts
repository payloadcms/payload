import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { slugify as defaultSlugify } from '../../../utilities/slugify.js'

type Args = {
  name: string
  slugify?: Slugify
  useAsSlug: string
}

/**
 * `beforeChange` hook for the native `slug` field.
 *
 * The slug is only ever filled while empty — never regenerated over a value that is already set:
 * - an explicit value from the client wins, normalized through the field's slugify (so `Hello World`
 *   sent by the API is stored as `hello-world`);
 * - an empty slug is derived from its source field (on create, or when a new locale is added on
 *   update); and
 * - a slug that is already set is preserved verbatim.
 *
 * Slugify runs only on the value provided this request (explicit input or source) — deterministic,
 * idempotent normalization. A stored slug is never re-slugified: that would rewrite it behind the
 * client's back (reviving the out-of-order autosave overwrite) and would corrupt a value minted by a
 * custom slugify if run through the default one.
 *
 * When a slug is still empty on create and has no source to derive from, it is left empty here and
 * backfilled from the document id in the `afterChange` hook (the id does not exist until the row is
 * inserted). See {@link generateSlugIdFallback}.
 */
export const generateSlug =
  ({ name, slugify: customSlugify, useAsSlug }: Args): FieldHook =>
  async ({ data, operation, originalDoc, req, value }) => {
    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data: (data ?? {}) as TypeWithID, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    // Explicit value from the client wins — normalized through the field's slugify.
    if (value !== undefined && value !== null && value !== '') {
      return await slugify(value)
    }

    const storedSlug = originalDoc?.[name]

    // On update, preserve a slug that is already set — only fill it while empty.
    if (
      operation !== 'create' &&
      storedSlug !== undefined &&
      storedSlug !== null &&
      storedSlug !== ''
    ) {
      return storedSlug
    }

    // Derive an empty slug from its source when present; otherwise leave it empty
    // (on create, the id fallback in afterChange backfills it).
    const source = data?.[useAsSlug]

    if (!source) {
      return storedSlug ?? undefined
    }

    return await slugify(source)
  }
