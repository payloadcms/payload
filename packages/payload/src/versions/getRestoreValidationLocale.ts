import type { SanitizedConfig } from '../config/types.js'
import type { Field, TabAsField } from '../fields/config/types.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized } from '../fields/config/types.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { flattenTopLevelFields } from '../utilities/flattenTopLevelFields.js'
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
        !field.name ||
        !fieldShouldBeLocalized({ field, parentIsLocalized })
      ) {
        return
      }

      const requiredDescendants = getRequiredDescendants({ field })
      if (!('required' in field && field.required) && requiredDescendants.length === 0) {
        return
      }

      const values: unknown = (ref as JsonObject)[field.name]
      if (!values || typeof values !== 'object' || Array.isArray(values)) {
        return
      }

      const populatedLocales = localeCodes.filter((code) => {
        const value = (values as Record<string, unknown>)[code]

        return (
          hasContent({ field, value }) &&
          requiredDescendants.every(({ field, path }) => {
            const descendant = path.reduce<unknown>(
              (parent, key) => (parent as Record<string, unknown> | undefined)?.[key],
              value,
            )

            return hasContent({ field, value: descendant })
          })
        )
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

/** Named groups and tabs store the locale at the container, above their required fields. */
function getRequiredDescendants({ field }: { field: Field | TabAsField }) {
  if (field.type !== 'group' && field.type !== 'tab') {
    return []
  }

  return flattenTopLevelFields(field.fields, { moveSubFieldsToTop: true }).flatMap((descendant) => {
    if (
      !fieldAffectsData(descendant) ||
      !descendant.name ||
      !('required' in descendant && descendant.required)
    ) {
      return []
    }

    return [{ field: descendant, path: (descendant.accessor ?? descendant.name).split('.') }]
  })
}

function hasContent({ field, value }: { field: Field | TabAsField; value: unknown }): boolean {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return false
  }

  if (field.type === 'richText' && field.editor && typeof field.editor !== 'function') {
    return !field.editor.isEmpty?.(value)
  }

  return true
}
