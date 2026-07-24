import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Slugify } from './types.js'

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
 * empty slug. Each empty locale takes its own `<singular>-<N>` fallback (deduped within that locale)
 * rather than mirroring the active locale, so one document never claims another's per-locale value.
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

  for (const field of collection.flattenedFields) {
    if (field.type !== 'slug' || !field.localized) {
      continue
    }

    const customSlugify = field.custom?.slugify as Slugify | undefined

    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    const localeValues = (data[field.name] ?? {}) as Record<string, unknown>

    for (const locale of localization.localeCodes) {
      if (hasValue(localeValues[locale])) {
        continue
      }

      localeValues[locale] = await getSlugFallbackValue({
        collection,
        field: field.name,
        locale,
        req,
        slugify,
      })
    }

    data[field.name] = localeValues
  }

  return data
}
