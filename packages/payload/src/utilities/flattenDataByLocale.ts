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
  parentIsLocalized?: boolean
}

/**
 * Returns a copy of stored locale-keyed data flattened to one locale without running after-read
 * hooks, access control, sanitization, or population.
 */
export function flattenDataByLocale({
  configBlockReferences,
  docWithLocales,
  fields,
  locale,
  parentIsLocalized = false,
}: Args): JsonObject {
  const result = deepCopyObjectSimple(docWithLocales)

  flattenFields({
    configBlockReferences,
    data: result,
    fields,
    locale,
    parentIsLocalized,
  })

  return result
}

type FlattenFieldsArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  data: JsonObject
  fields: Field[]
  locale: string
  parentIsLocalized: boolean
}

function flattenFields({
  configBlockReferences,
  data,
  fields,
  locale,
  parentIsLocalized,
}: FlattenFieldsArgs): void {
  for (const field of fields) {
    if (fieldAffectsData(field)) {
      const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

      if (isLocalized) {
        data[field.name] = getLocaleValue({
          locale,
          value: data[field.name],
        })
      }

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
                parentIsLocalized: parentIsLocalized || Boolean(tab.localized),
              })
            }
          } else {
            flattenFields({
              configBlockReferences,
              data,
              fields: tab.fields,
              locale,
              parentIsLocalized,
            })
          }
        }
        break
    }
  }
}

function getLocaleValue({ locale, value }: { locale: string; value: unknown }): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return (value as Record<string, unknown>)[locale]
  }

  return value
}
