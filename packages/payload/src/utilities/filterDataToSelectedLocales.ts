import type { Block, Field, FlattenedBlock } from '../fields/config/types.js'
import type { SanitizedConfig } from '../index.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../fields/config/types.js'

type FilterDataToSelectedLocalesArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  docWithLocales: JsonObject
  fields: Field[]
  parentIsLocalized?: boolean
  selectedLocales: string[]
}

/**
 * Filters localized field data to only include specified locales.
 * For non-localized fields, returns all data as-is.
 * For localized fields, if selectedLocales is provided, returns only those locales.
 * If selectedLocales is not provided and field is localized, returns all locales.
 */
export function filterDataToSelectedLocales({
  configBlockReferences,
  docWithLocales,
  fields,
  parentIsLocalized = false,
  selectedLocales,
}: FilterDataToSelectedLocalesArgs): JsonObject {
  if (!docWithLocales || typeof docWithLocales !== 'object') {
    return docWithLocales
  }

  const result: JsonObject = {}

  for (const field of fields) {
    if (fieldAffectsData(field)) {
      const fieldIsLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

      switch (field.type) {
        case 'array': {
          if (Array.isArray(docWithLocales[field.name])) {
            result[field.name] = docWithLocales[field.name].map((item: JsonObject) =>
              filterDataToSelectedLocales({
                configBlockReferences,
                docWithLocales: item,
                fields: field.fields,
                parentIsLocalized: fieldIsLocalized,
                selectedLocales,
              }),
            )
          }
          break
        }

        case 'blocks': {
          if (field.name in docWithLocales && Array.isArray(docWithLocales[field.name])) {
            result[field.name] = docWithLocales[field.name].map((blockData: JsonObject) => {
              let block: Block | FlattenedBlock | undefined
              if (configBlockReferences && field.blockReferences) {
                for (const blockOrReference of field.blockReferences) {
                  if (typeof blockOrReference === 'string') {
                    block = configBlockReferences.find((b) => b.slug === blockData.blockType)
                  } else {
                    block = blockOrReference
                  }
                }
              } else if (field.blocks) {
                block = field.blocks.find((b) => b.slug === blockData.blockType)
              }

              if (block) {
                const filtered = filterDataToSelectedLocales({
                  configBlockReferences,
                  docWithLocales: blockData,
                  fields: block?.fields || [],
                  parentIsLocalized: fieldIsLocalized,
                  selectedLocales,
                })
                return {
                  ...filtered,
                  blockType: blockData.blockType,
                  ...(blockData.id !== undefined && { id: blockData.id }),
                }
              }

              return blockData
            })
          }
          break
        }

        case 'group': {
          // Named groups create a nested data structure
          if (
            fieldAffectsData(field) &&
            field.name in docWithLocales &&
            typeof docWithLocales[field.name] === 'object'
          ) {
            result[field.name] = filterDataToSelectedLocales({
              configBlockReferences,
              docWithLocales: docWithLocales[field.name] as JsonObject,
              fields: field.fields,
              parentIsLocalized: fieldIsLocalized,
              selectedLocales,
            })
          } else {
            // Unnamed groups pass through the same data level
            const nestedResult = filterDataToSelectedLocales({
              configBlockReferences,
              docWithLocales,
              fields: field.fields,
              parentIsLocalized,
              selectedLocales,
            })
            Object.assign(result, nestedResult)
          }
          break
        }

        default: {
          // For all other data-affecting fields (text, number, select, etc.)
          if (field.name in docWithLocales) {
            const value = docWithLocales[field.name]

            // If the field is localized and has locale data
            if (fieldIsLocalized && value && typeof value === 'object' && !Array.isArray(value)) {
              // If selectedLocales is provided, filter to only those locales
              if (selectedLocales && selectedLocales.length > 0) {
                const filtered: Record<string, unknown> = {}
                for (const locale of selectedLocales) {
                  if (locale in value) {
                    filtered[locale] = value[locale]
                  }
                }
                if (Object.keys(filtered).length > 0) {
                  result[field.name] = filtered
                }
              } else {
                // If no selectedLocales, include all locales
                result[field.name] = value
              }
            } else {
              // Non-localized field or non-object value
              result[field.name] = value
            }
          }
          break
        }
      }
    } else {
      // Layout-only fields that don't affect data structure
      switch (field.type) {
        case 'collapsible':
        case 'row': {
          // These pass through the same data level
          const nestedResult = filterDataToSelectedLocales({
            configBlockReferences,
            docWithLocales,
            fields: field.fields,
            parentIsLocalized,
            selectedLocales,
          })
          Object.assign(result, nestedResult)
          break
        }

        case 'tabs': {
          for (const tab of field.tabs) {
            if (tabHasName(tab)) {
              // Named tabs create a nested data structure
              if (tab.name in docWithLocales && typeof docWithLocales[tab.name] === 'object') {
                result[tab.name] = filterDataToSelectedLocales({
                  configBlockReferences,
                  docWithLocales: docWithLocales[tab.name],
                  fields: tab.fields,
                  parentIsLocalized,
                  selectedLocales,
                })
              }
            } else {
              // Unnamed tabs pass through the same data level
              const nestedResult = filterDataToSelectedLocales({
                configBlockReferences,
                docWithLocales,
                fields: tab.fields,
                parentIsLocalized,
                selectedLocales,
              })
              Object.assign(result, nestedResult)
            }
          }
          break
        }
      }
    }
  }

  return result
}
