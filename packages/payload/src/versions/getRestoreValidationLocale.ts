import type { SanitizedConfig } from '../config/types.js'
import type { Field, TabAsField } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized } from '../fields/config/types.js'
import { flattenValidationData } from '../fields/hooks/beforeChange/flattenValidationData.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { flattenTopLevelFields } from '../utilities/flattenTopLevelFields.js'
import { traverseFields } from '../utilities/traverseFields.js'

/**
 * Selects the locale whose data is passed to the collection restore validators.
 * A version can have been published before the default translation was written.
 * Validating the stored translation lets the restore preserve each locale's values.
 * A missing value only affects locale selection when the field's condition allows validation.
 */
export function getRestoreValidationLocale({
  id,
  config,
  fields,
  locale,
  skipValidation,
  user,
  version,
}: {
  config: SanitizedConfig
  fields: Field[]
  id: number | string
  locale: string
  skipValidation: boolean
  user: PayloadRequest['user']
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

  const documentsByLocale = new Map<string, JsonObject>()
  const isConditionInactive = ({
    blockPath,
    code,
    field,
    path,
  }: {
    blockPath?: string[]
    code: string
    field: Field | TabAsField
    path: string[]
  }): boolean => {
    const condition = field.admin?.condition
    if (!condition) {
      return false
    }

    let data = documentsByLocale.get(code)
    if (!data) {
      data = flattenValidationData({ config, data: { ...version, id }, fields, locale: code })
      documentsByLocale.set(code, data)
    }

    return !condition(data, getValueAtPath({ data, path: path.slice(0, -1) }) ?? {}, {
      blockData: (blockPath ? getValueAtPath({ data, path: blockPath }) : undefined) as JsonObject,
      operation: 'update',
      path,
      user,
    })
  }

  const candidates = new Set(localeCodes)
  traverseFields({
    callback: ({ dataScope, field, parentIsLocalized, ref }) => {
      if (
        !dataScope ||
        !fieldAffectsData(field) ||
        !field.name ||
        !fieldShouldBeLocalized({ field, parentIsLocalized })
      ) {
        return
      }

      const isRequired = 'required' in field && field.required
      const requiredDescendants = getRequiredDescendants({ field })
      if (!isRequired && requiredDescendants.length === 0) {
        return
      }

      const values: unknown = (ref as JsonObject)[field.name]
      if (!values || typeof values !== 'object' || Array.isArray(values)) {
        return
      }

      const fieldPath = [...dataScope.path, field.name]
      const { blockPath } = dataScope
      const eligibleLocales = localeCodes.filter((code) => {
        const value = (values as Record<string, unknown>)[code]

        const hasRequiredContent =
          (!isRequired || hasContent({ field, value })) &&
          requiredDescendants.every(({ field, path }) => {
            return (
              hasContent({ field, value: getValueAtPath({ data: value, path }) }) ||
              isConditionInactive({ blockPath, code, field, path: [...fieldPath, ...path] })
            )
          })

        return (
          hasRequiredContent || isConditionInactive({ blockPath, code, field, path: fieldPath })
        )
      })
      if (eligibleLocales.length > 0) {
        for (const candidate of candidates) {
          if (!eligibleLocales.includes(candidate)) {
            candidates.delete(candidate)
          }
        }
      }
    },
    config,
    dataScope: { path: [] },
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

function getValueAtPath({ data, path }: { data: unknown; path: string[] }): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
    data,
  )
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
