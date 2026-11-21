import type { SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized } from '../fields/config/types.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { traverseFields } from '../utilities/traverseFields.js'

/**
 * Selects the locale whose data is passed to the collection restore validators.
 * A version can have been published before the default translation was written.
 * Validating the stored translation lets the restore preserve each locale's values.
 */
export function getRestoreValidationLocale({
  config,
  fields,
  locale,
  skipValidation,
  version,
}: {
  config: SanitizedConfig
  fields: Field[]
  locale: string
  skipValidation: boolean
  version: JsonObject
}): string {
  const { localization } = config
  if (!localization) {
    return locale
  }

  const { defaultLocale, localeCodes } = localization
  if (skipValidation || localeCodes.length < 2) {
    return defaultLocale
  }

  const publishedLocales = localeCodes.filter((code) => version._status?.[code] === 'published')
  if (publishedLocales.includes(defaultLocale)) {
    return defaultLocale
  }

  const candidates = new Set(localeCodes)
  traverseFields({
    callback: ({ field, parentIsLocalized, ref }) => {
      if (
        !fieldAffectsData(field) ||
        !('required' in field && field.required) ||
        !fieldShouldBeLocalized({ field, parentIsLocalized })
      ) {
        return
      }

      const values: unknown = (ref as JsonObject)[field.name]
      if (!values || typeof values !== 'object' || Array.isArray(values)) {
        return
      }

      const populatedLocales = localeCodes.filter((code) => {
        const value = (values as Record<string, unknown>)[code]
        return value != null && value !== '' && (!Array.isArray(value) || value.length > 0)
      })
      if (populatedLocales.length > 0) {
        for (const candidate of candidates) {
          if (!populatedLocales.includes(candidate)) {
            candidates.delete(candidate)
          }
        }
      }
    },
    config,
    fields,
    fillEmpty: false,
    ref: deepCopyObjectSimple(version),
  })

  if (candidates.has(defaultLocale)) {
    return defaultLocale
  }

  const allowedLocales = publishedLocales.length ? publishedLocales : localeCodes
  if (allowedLocales.includes(locale) && candidates.has(locale)) {
    return locale
  }

  return allowedLocales.find((code) => candidates.has(code)) ?? defaultLocale
}
