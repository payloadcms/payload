import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { ValidationError } from '../../../errors/index.js'
import { fieldValueExists } from '../../../utilities/fieldValueExists.js'
import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { hasDraftsEnabled } from '../../../utilities/getVersionsConfig.js'
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
      const slugified = await slugify(value)

      // An explicit slug must be unique — reject a collision rather than silently changing it
      // (generated values below are deduped instead). Enforced here, not in validation: the DB
      // unique index misses draft-only slugs, and draft saves skip validation but still run hooks.
      if (
        collection &&
        hasValue(slugified) &&
        (await fieldValueExists({
          id: originalDoc?.id,
          collection: collection.slug,
          draftsEnabled: hasDraftsEnabled(collection),
          field: name,
          req,
          value: slugified,
        }))
      ) {
        throw new ValidationError(
          { errors: [{ message: req.t('error:valueMustBeUnique'), path: name }] },
          req.t,
        )
      }

      return slugified
    }

    const storedSlug = originalDoc?.[name]

    // On update, preserve a slug that is already set — only fill it while empty.
    if (operation !== 'create' && hasValue(storedSlug)) {
      return storedSlug
    }

    // Derive an empty slug from its source when present, deduped so two same-source documents don't
    // both claim it. Localized/global slugs use a plain slugify (uniqueness there is out of scope).
    const source = data?.[useAsSlug]
    const derived = source ? await slugify(source) : undefined

    if (hasValue(derived)) {
      if (!collection || localized) {
        return derived
      }

      return await getUniqueFieldValue({
        id: originalDoc?.id,
        collection: collection.slug,
        draftsEnabled: hasDraftsEnabled(collection),
        field: name,
        req,
        value: derived as string,
      })
    }

    // No usable source: keep a stored value, otherwise fall back to `<singular>-<N>`.
    if (hasValue(storedSlug)) {
      return storedSlug
    }

    if (!collection || localized) {
      return undefined
    }

    return await getSlugFallbackValue({ collection, field: name, req, slugify })
  }
