import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Condition, Field, TabAsField } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized } from '../fields/config/types.js'
import { getFieldPaths } from '../fields/getFieldPaths.js'
import { afterRead } from '../fields/hooks/afterRead/index.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'

type FieldCondition = {
  blockPath?: string[]
  condition: Condition
  path: string[]
}

/**
 * Selects the locale whose stored data is passed to the collection restore validators.
 * A version can have been published before the default translation was written.
 */
export async function getRestoreValidationLocale({
  id,
  collection,
  draft,
  locale,
  req,
  skipValidation,
  version,
}: {
  collection: SanitizedCollectionConfig
  draft: boolean
  id: number | string
  locale: string
  req: PayloadRequest
  skipValidation: boolean
  version: JsonObject
}): Promise<string> {
  const { localization } = req.payload.config
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

  const excludedLocalesByPath = new Map<string, Set<string>>()
  for (const code of [defaultLocale, ...localeCodes.filter((code) => code !== defaultLocale)]) {
    const requiredFields = getRequiredFields({
      data: version,
      fields: collection.fields,
      locale: code,
      parentPath: '',
      req,
    })
    let conditionData: JsonObject | undefined

    for (const { conditions, field, localizedPath, value } of requiredFields) {
      const excludedLocales = excludedLocalesByPath.get(localizedPath)
      if (excludedLocales?.has(code) || hasContent({ field, value })) {
        continue
      }

      if (conditions.length > 0) {
        const data = (conditionData ??= await afterRead({
          collection,
          context: req.context,
          depth: 0,
          doc: deepCopyObjectSimple({ ...version, id }),
          draft,
          fallbackLocale: null,
          global: null,
          locale: code,
          overrideAccess: true,
          req,
          runReadHooksAndPopulation: false,
          showHiddenFields: true,
        }))

        if (conditions.some((condition) => isConditionInactive({ condition, data, req }))) {
          continue
        }
      }

      if (excludedLocales) {
        excludedLocales.add(code)
      } else {
        excludedLocalesByPath.set(localizedPath, new Set([code]))
      }
    }

    if (code === defaultLocale && excludedLocalesByPath.size === 0) {
      return defaultLocale
    }
  }

  const candidates = new Set(localeCodes)
  for (const excludedLocales of excludedLocalesByPath.values()) {
    // An empty required field in every locale cannot guide locale selection.
    if (excludedLocales.size < localeCodes.length) {
      for (const code of excludedLocales) {
        candidates.delete(code)
      }
    }
  }

  if (candidates.has(defaultLocale)) {
    return defaultLocale
  }

  const allowedLocales = publishedLocales.length ? publishedLocales : localeCodes
  if (allowedLocales.includes(locale) && candidates.has(locale)) {
    return locale
  }

  return allowedLocales.find((code) => candidates.has(code)) ?? defaultLocale
}

function isConditionInactive({
  condition: { blockPath, condition, path },
  data,
  req,
}: {
  condition: FieldCondition
  data: JsonObject
  req: PayloadRequest
}): boolean {
  return !condition(data, getValueAtPath({ data, path: path.slice(0, -1) }) ?? {}, {
    blockData: (blockPath ? getValueAtPath({ data, path: blockPath }) : undefined) as JsonObject,
    operation: 'update',
    path,
    user: req.user,
  })
}

function getValueAtPath({ data, path }: { data: unknown; path: string[] }): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
    data,
  )
}

/** Collects required fields and their conditions for the rows present in one translation. */
function getRequiredFields({
  blockPath,
  data,
  fields,
  locale,
  localizedPath,
  parentConditions = [],
  parentIndexPath = '',
  parentIsLocalized = false,
  parentPath,
  req,
}: {
  blockPath?: string[]
  data: unknown
  fields: (Field | TabAsField)[]
  locale: string
  localizedPath?: string
  parentConditions?: FieldCondition[]
  parentIndexPath?: string
  parentIsLocalized?: boolean
  parentPath: string
  req: PayloadRequest
}): {
  conditions: FieldCondition[]
  field: Field | TabAsField
  localizedPath: string
  value: unknown
}[] {
  return fields.flatMap((field, index) => {
    const { indexPath, path } = getFieldPaths({
      field,
      index,
      parentIndexPath,
      parentPath,
      parentSchemaPath: '',
    })
    const condition = field.admin?.condition
    const conditions = condition
      ? [...parentConditions, { blockPath, condition, path: path.split('.') }]
      : parentConditions
    const name = fieldAffectsData(field) ? field.name : undefined
    const storedValue = name ? getValueAtPath({ data, path: [name] }) : data
    const hasLocaleMap =
      name &&
      fieldShouldBeLocalized({ field, parentIsLocalized }) &&
      storedValue &&
      typeof storedValue === 'object' &&
      !Array.isArray(storedValue)
    const value = hasLocaleMap ? getValueAtPath({ data: storedValue, path: [locale] }) : storedValue
    const fieldLocalizedPath = localizedPath ?? (hasLocaleMap ? path : undefined)
    const required =
      name && fieldLocalizedPath && 'required' in field && field.required
        ? [{ conditions, field, localizedPath: fieldLocalizedPath, value }]
        : []
    const childrenAreLocalized =
      parentIsLocalized || ('localized' in field && field.localized === true)

    switch (field.type) {
      case 'array':
      case 'blocks':
        if (!Array.isArray(value)) {
          return required
        }
        return [
          ...required,
          ...value.flatMap((row, rowIndex) => {
            let rowFields: Field[] | undefined
            if (field.type === 'array') {
              rowFields = field.fields
            } else if (typeof row?.blockType === 'string') {
              const { blockType } = row
              const block = field.blocks.find((block) =>
                typeof block === 'string' ? block === blockType : block.slug === blockType,
              )
              rowFields = (typeof block === 'string' ? req.payload.blocks[block] : block)?.fields
            }

            if (!rowFields) {
              return []
            }

            const rowPath = `${path}.${rowIndex}`
            return getRequiredFields({
              blockPath: field.type === 'blocks' ? rowPath.split('.') : blockPath,
              data: row,
              fields: rowFields,
              locale,
              localizedPath: fieldLocalizedPath,
              parentConditions: conditions,
              parentIsLocalized: childrenAreLocalized,
              parentPath: rowPath,
              req,
            })
          }),
        ]
      case 'collapsible':
      case 'group':
      case 'row':
      case 'tab':
        return [
          ...required,
          ...getRequiredFields({
            blockPath,
            data: value,
            fields: field.fields,
            locale,
            localizedPath: fieldLocalizedPath,
            parentConditions: conditions,
            parentIndexPath: indexPath,
            parentIsLocalized: childrenAreLocalized,
            parentPath: name ? path : parentPath,
            req,
          }),
        ]
      case 'tabs':
        return getRequiredFields({
          blockPath,
          data,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          locale,
          localizedPath: fieldLocalizedPath,
          parentConditions: conditions,
          parentIndexPath: indexPath,
          parentIsLocalized: childrenAreLocalized,
          parentPath: path,
          req,
        })
      default:
        return required
    }
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
