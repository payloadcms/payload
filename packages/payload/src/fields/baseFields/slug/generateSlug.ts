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
 * `beforeChange` hook for the native `slug` field.
 *
 * Fills the slug only while empty and never rewrites one that's set, so a lagging autosave can't
 * clobber it with a stale value:
 *   - empty with no source falls back to `<singular>-<N>`, e.g. `posts-1` (see {@link getSlugFallbackValue})
 *   - explicit input and the source field are slugified, e.g. "Hello World" → "hello-world"
 *   - an already-set slug is preserved as-is
 *
 * Generated values dedupe against existing slugs; a localized slug is unique per-locale, so its
 * dedupe and fallback are scoped to the locale being written. Globals have no collection to dedupe
 * against, so their slug is left as-is.
 */
export const generateSlug =
  ({ name, localized, slugify: customSlugify, useAsSlug }: Args): FieldHook =>
  async ({ collection, context, data, operation, originalDoc, req, value }) => {
    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data: (data ?? {}) as TypeWithID, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    // A localized slug is unique only within its locale, so every uniqueness query below is scoped
    // to the locale being written.
    const locale = localized ? (req.locale ?? undefined) : undefined

    // A duplicated document:
    //  - Takes a fresh `<singular>-<N>` fallback — not the original's slug, not a source-derived one
    //  - Skips the explicit-collision check below (see generateSlugBeforeDuplicate).
    if (collection && consumeSlugDuplicateFallback(context, name)) {
      return await getSlugFallbackValue({ collection, field: name, locale, req, slugify })
    }

    const storedSlug = originalDoc?.[name]

    const storedSlugHasValue = hasValue(storedSlug)

    // Explicit value from the client wins — normalized through the field's slugify.
    // It must be unique: reject a collision rather than silently changing it,
    // only generated values are automatically deduped.
    // A value that slugifies to nothing (e.g. "!!!") isn't a usable slug,
    // so fall through to the source/fallback rather than store an empty one.
    if (hasValue(value)) {
      const slugified = await slugify(value)

      if (hasValue(slugified)) {
        // Unchanged from what's stored — already unique, so skip the collision query. Autosave
        // resends the current slug on every tick; without this each tick runs a needless read.
        if (slugified === storedSlug) {
          return storedSlug
        }

        if (
          collection &&
          (await fieldValueExists({
            id: originalDoc?.id,
            collection: collection.slug,
            draftsEnabled: hasDraftsEnabled(collection),
            field: name,
            locale,
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
    }

    // On update, preserve a slug that is already set — only fill it while empty.
    if (operation !== 'create' && storedSlugHasValue) {
      return storedSlug
    }

    // Derive an empty slug from its source, when present.
    // Dedupe so two documents don't both claim it if they have the same source value.
    // Globals have no collection to dedupe against.
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

    // No usable source: keep a stored value, otherwise fall back to `<singular>-<N>`.
    if (storedSlugHasValue) {
      return storedSlug
    }

    if (!collection) {
      return undefined
    }

    return await getSlugFallbackValue({ collection, field: name, locale, req, slugify })
  }
