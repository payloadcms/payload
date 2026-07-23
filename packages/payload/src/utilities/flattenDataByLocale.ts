import type { Block, Field, FlattenedBlock } from '../fields/config/types.js'
import type { SanitizedConfig } from '../index.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../fields/config/types.js'
import { deepCopyObjectSimple } from './deepCopyObject.js'

type Args = {
  configBlockReferences: SanitizedConfig['blocks']
  docWithLocales: JsonObject
  fields: Field[]
  locale: string
  localeCodes?: string[]
  parentIsLocalized?: boolean
}

/**
 * Returns a copy of stored locale-keyed data flattened to one locale and converts field storage
 * representations needed by validators, without running after-read hooks, access control,
 * sanitization, or population.
 */
export function flattenDataByLocale({
  configBlockReferences,
  docWithLocales,
  fields,
  locale,
  localeCodes,
  parentIsLocalized = false,
}: Args): JsonObject {
  const result = deepCopyObjectSimple(docWithLocales)

  flattenFields({
    configBlockReferences,
    data: result,
    fields,
    locale,
    localeCodes,
    parentIsLocalized,
  })

  return result
}

type FlattenFieldsArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  data: JsonObject
  fields: Field[]
  locale: string
  localeCodes?: string[]
  parentIsLocalized: boolean
}

function flattenFields({
  configBlockReferences,
  data,
  fields,
  locale,
  localeCodes,
  parentIsLocalized,
}: FlattenFieldsArgs): void {
  for (const field of fields) {
    if (fieldAffectsData(field)) {
      const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

      if (isLocalized) {
        data[field.name] = getLocaleValue({
          locale,
          localeCodes,
          value: data[field.name],
        })
      }

      data[field.name] = transformStoredFieldValue({
        field,
        value: data[field.name],
      })

      const fieldValue = data[field.name]
      const nestedParentIsLocalized = parentIsLocalized || Boolean(field.localized)

      switch (field.type) {
        case 'array': {
          if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (row && typeof row === 'object') {
                flattenFields({
                  configBlockReferences,
                  data: row,
                  fields: field.fields,
                  locale,
                  localeCodes,
                  parentIsLocalized: nestedParentIsLocalized,
                })
              }
            }
          }
          break
        }

        case 'blocks': {
          if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (!row || typeof row !== 'object') {
                continue
              }

              const blockOrSlug = field.blocks.find((block) => {
                const blockSlug = typeof block === 'string' ? block : block.slug
                return blockSlug === row.blockType
              })
              const block: Block | FlattenedBlock | undefined =
                typeof blockOrSlug === 'string'
                  ? configBlockReferences?.find(({ slug }) => slug === blockOrSlug)
                  : blockOrSlug

              if (block) {
                flattenFields({
                  configBlockReferences,
                  data: row,
                  fields: block.fields,
                  locale,
                  localeCodes,
                  parentIsLocalized: nestedParentIsLocalized,
                })
              }
            }
          }
          break
        }

        case 'group': {
          if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
            flattenFields({
              configBlockReferences,
              data: fieldValue,
              fields: field.fields,
              locale,
              localeCodes,
              parentIsLocalized: nestedParentIsLocalized,
            })
          }
          break
        }
      }

      continue
    }

    switch (field.type) {
      case 'collapsible':
      case 'group':
      case 'row':
        flattenFields({
          configBlockReferences,
          data,
          fields: field.fields,
          locale,
          localeCodes,
          parentIsLocalized,
        })
        break

      case 'tabs':
        for (const tab of field.tabs) {
          if (tabHasName(tab)) {
            const isLocalized = fieldShouldBeLocalized({ field: tab, parentIsLocalized })

            if (isLocalized) {
              data[tab.name] = getLocaleValue({
                locale,
                localeCodes,
                value: data[tab.name],
              })
            }

            const tabData = data[tab.name]

            if (tabData && typeof tabData === 'object' && !Array.isArray(tabData)) {
              flattenFields({
                configBlockReferences,
                data: tabData,
                fields: tab.fields,
                locale,
                localeCodes,
                parentIsLocalized: parentIsLocalized || Boolean(tab.localized),
              })
            }
          } else {
            flattenFields({
              configBlockReferences,
              data,
              fields: tab.fields,
              locale,
              localeCodes,
              parentIsLocalized,
            })
          }
        }
        break
    }
  }
}

function transformStoredFieldValue({ field, value }: { field: Field; value: unknown }): unknown {
  switch (field.type) {
    case 'point': {
      if (Array.isArray(value)) {
        return value
      }

      if (value && typeof value === 'object') {
        const coordinates = (value as Record<string, unknown>).coordinates

        if (Array.isArray(coordinates) && coordinates.length === 2) {
          return coordinates
        }
      }

      return undefined
    }

    default:
      return value
  }
}

function getLocaleValue({
  locale,
  localeCodes,
  value,
}: {
  locale: string
  localeCodes?: string[]
  value: unknown
}): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const objectValue = value as Record<string, unknown>
    const isLocaleMap =
      !localeCodes || Object.keys(objectValue).some((key) => localeCodes.includes(key))

    return isLocaleMap ? objectValue[locale] : value
  }

  return value
}
