import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Slugify } from './types.js'

import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { hasDraftsEnabled } from '../../../utilities/getVersionsConfig.js'
import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { getSlugFallbackValue } from './getSlugFallbackValue.js'
import { hasValue } from './hasValue.js'

type Args = {
  collection: SanitizedCollectionConfig
  /** The post-`beforeChange` data, with localized fields already keyed by locale. */
  data: JsonObject
  req: PayloadRequest
}

/**
 * On create, seed every locale of a localized slug field so switching locales never lands on an
 * empty slug. Each empty locale derives from its own source value — a non-localized source applies
 * to every locale, so they follow it just like the active locale did — and falls back to a per-locale
 * `<singular>-<N>` only when that locale has no source. Both are deduped within the locale, so one
 * document never claims another's per-locale value.
 *
 * Runs after field `beforeChange`, mirroring the localized `_status` expansion — the slug field hook
 * only sees the active locale, so the other locales are filled here at the operation level. A slug
 * is static once set, so this is create-only; per-locale edits afterward stay scoped to their locale.
 */
export const fillEmptyLocalizedSlugs = async ({
  collection,
  data,
  req,
}: Args): Promise<JsonObject> => {
  const { localization } = req.payload.config

  if (!localization || localization.localeCodes.length < 2) {
    return data
  }

  const draftsEnabled = hasDraftsEnabled(collection)

  for (const field of collection.flattenedFields) {
    if (field.type !== 'slug' || !field.localized) {
      continue
    }

    const customSlugify = field.custom?.slugify as Slugify | undefined

    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    // The source value for a given locale: a non-localized source is shared across all locales, a
    // localized one is read per-locale (only the locales present in this create have a value).
    const sourceField = collection.flattenedFields.find((f) => f.name === field.useAsSlug)
    const source = data[field.useAsSlug]

    const localeValues = (data[field.name] ?? {}) as Record<string, unknown>

    for (const locale of localization.localeCodes) {
      if (hasValue(localeValues[locale])) {
        continue
      }

      const sourceForLocale = sourceField?.localized
        ? (source as Record<string, unknown> | undefined)?.[locale]
        : source

      const derived = sourceForLocale ? await slugify(sourceForLocale) : undefined

      localeValues[locale] = hasValue(derived)
        ? await getUniqueFieldValue({
            collection: collection.slug,
            draftsEnabled,
            field: field.name,
            locale,
            req,
            value: derived as string,
          })
        : await getSlugFallbackValue({ collection, field: field.name, locale, req, slugify })
    }

    data[field.name] = localeValues
  }

  return data
}
