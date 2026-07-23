import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { ValidationError } from '../../../errors/index.js'
import { fieldValueExists } from '../../../utilities/fieldValueExists.js'
import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { hasDraftsEnabled } from '../../../utilities/getVersionsConfig.js'
import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { consumeSlugDuplicateFallback } from './duplicateContext.js'
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
 * Generated values dedupe against existing slugs; a localized slug is unique per-locale, so its
 * dedupe check is scoped to the locale being written. A localized slug with no source is left empty
 * rather than taking a `<singular>-<N>` fallback (localized slugs are optional by default), and
 * globals have no collection to dedupe against.
 */
export const generateSlug =
  ({ name, localized, slugify: customSlugify, useAsSlug }: Args): FieldHook =>
  async ({ collection, context, data, operation, originalDoc, req, value }) => {
    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data: (data ?? {}) as TypeWithID, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    // A duplicated document takes a fresh `<singular>-<N>` fallback — not the original's slug, not a
    // source-derived one — and skips the explicit-collision check below (see
    // generateSlugBeforeDuplicate).
    if (collection && !localized && consumeSlugDuplicateFallback(context, name)) {
      return await getSlugFallbackValue({ collection, field: name, req, slugify })
    }

    // Explicit value from the client wins — normalized through the field's slugify. It must be
    // unique: reject a collision rather than silently changing it (generated values below dedupe
    // instead). Enforced here, not in validation — the DB unique index misses draft-only slugs, and
    // draft saves skip validation but still run hooks. A localized slug is unique only within its
    // locale, so the check is scoped to the one being written.
    if (hasValue(value)) {
      const slugified = await slugify(value)

      if (
        collection &&
        hasValue(slugified) &&
        (await fieldValueExists({
          id: originalDoc?.id,
          collection: collection.slug,
          draftsEnabled: hasDraftsEnabled(collection),
          field: name,
          locale: localized ? (req.locale ?? undefined) : undefined,
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

    const storedSlugHasValue = hasValue(storedSlug)

    // On update, preserve a slug that is already set — only fill it while empty.
    if (operation !== 'create' && storedSlugHasValue) {
      return storedSlug
    }

    // A localized slug is unique only within its locale, so every generated-value query below is
    // scoped to the locale being written.
    const locale = localized ? (req.locale ?? undefined) : undefined

    // Derive an empty slug from its source when present, deduped so two same-source documents don't
    // both claim it. Globals have no collection to dedupe against.
    const source = data?.[useAsSlug]
    const derived = source ? await slugify(source) : undefined

    if (hasValue(derived)) {
      if (!collection) {
        return derived
      }

      return await getUniqueFieldValue({
        id: originalDoc?.id,
        collection: collection.slug,
        draftsEnabled: hasDraftsEnabled(collection),
        field: name,
        locale,
        req,
        value: derived as string,
      })
    }

    // No usable source: keep a stored value, otherwise fall back to `<singular>-<N>`. A localized
    // slug is left empty — a per-locale fallback for every locale isn't wanted, and localized slugs
    // are optional by default.
    if (storedSlugHasValue) {
      return storedSlug
    }

    if (!collection || localized) {
      return undefined
    }

    return await getSlugFallbackValue({ collection, field: name, req, slugify })
  }
