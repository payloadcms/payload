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
 * If selectedLocales array is not empty, returns only those locales.
 * If selectedLocales array is empty, return all locales.
 */
export function filterDataToSelectedLocales({
  configBlockReferences,
  docWithLocales,
  fields,
  parentIsLocalized = false,
  selectedLocales,
}: FilterDataToSelectedLocalesArgs): JsonObject {
  if (
    (docWithLocales && typeof docWithLocales === 'object' && Array.isArray(docWithLocales)) ||
    selectedLocales.length === 0
  ) {
    return docWithLocales
  }

  const result: JsonObject = {}

  for (const field of fields) {
    if (fieldAffectsData(field)) {
      const fieldIsLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

      switch (field.type) {
        case 'array': {
          if (field.name in docWithLocales) {
            const value = docWithLocales[field.name]

            if (fieldIsLocalized && value && typeof value === 'object' && !Array.isArray(value)) {
              const filtered: Record<string, unknown> = {}
              for (const locale of selectedLocales) {
                if (locale in value && Array.isArray(value[locale])) {
                  filtered[locale] = value[locale]
                }
              }
              if (Object.keys(filtered).length > 0) {
                result[field.name] = filtered
              }
            } else if (Array.isArray(value)) {
              // Non-localized array
              result[field.name] = value.map((item: JsonObject) => {
                const filtered = filterDataToSelectedLocales({
                  configBlockReferences,
                  docWithLocales: item,
                  fields: field.fields,
                  parentIsLocalized: fieldIsLocalized,
                  selectedLocales,
                })

                if ('id' in item && !('id' in filtered)) {
                  filtered.id = item.id
                }

                return filtered
              })
            }
          }
          break
        }

        case 'blocks': {
          if (field.name in docWithLocales) {
            const value = docWithLocales[field.name]

            if (fieldIsLocalized && value && typeof value === 'object' && !Array.isArray(value)) {
              const filtered: Record<string, unknown> = {}
              for (const locale of selectedLocales) {
                if (locale in value && Array.isArray(value[locale])) {
                  filtered[locale] = value[locale]
                }
              }
              result[field.name] = filtered
            } else if (Array.isArray(value)) {
              // Non-localized blocks
              result[field.name] = value.map((blockData: JsonObject) => {
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

                if (!block) {
                  return blockData
                }

                const filterd = filterDataToSelectedLocales({
                  configBlockReferences,
                  docWithLocales: blockData,
                  fields: block?.fields || [],
                  parentIsLocalized: fieldIsLocalized,
                  selectedLocales,
                })

                if ('id' in blockData && !('id' in filterd)) {
                  filterd.id = blockData.id
                }
                if ('blockType' in blockData && !('blockType' in filterd)) {
                  filterd.blockType = blockData.blockType
                }
                if ('blockName' in blockData && !('blockName' in filterd)) {
                  filterd.blockName = blockData.blockName
                }

                return filterd
              })
            }
          }
          break
        }

        case 'group': {
          if (
            field?.name &&
            field.name in docWithLocales &&
            typeof docWithLocales[field.name] === 'object'
          ) {
            const value = docWithLocales[field.name]

            if (fieldIsLocalized && !Array.isArray(value)) {
              const filtered: Record<string, unknown> = {}
              for (const locale of selectedLocales) {
                if (locale in value) {
                  filtered[locale] = value[locale]
                }
              }
              result[field.name] = filtered
            } else {
              // Non-localized group
              result[field.name] = filterDataToSelectedLocales({
                configBlockReferences,
                docWithLocales: value as JsonObject,
                fields: field.fields,
                parentIsLocalized: fieldIsLocalized,
                selectedLocales,
              })
            }
          }
          break
        }

        default: {
          // For all other data-affecting fields (text, number, select, etc.)
          if (field.name in docWithLocales) {
            const value = docWithLocales[field.name]

            if (fieldIsLocalized) {
              const filtered: Record<string, unknown> = {}
              for (const locale of selectedLocales) {
                if (locale in value) {
                  filtered[locale] = value[locale]
                }
              }
              result[field.name] = filtered
            } else {
              // Non-localized field
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
        case 'group':
        case 'row': {
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
              if (tab.name in docWithLocales && typeof docWithLocales[tab.name] === 'object') {
                const value = docWithLocales[tab.name]
                const tabIsLocalized = fieldShouldBeLocalized({ field: tab, parentIsLocalized })

                if (tabIsLocalized) {
                  const filtered: Record<string, unknown> = {}
                  for (const locale of selectedLocales) {
                    if (locale in value) {
                      filtered[locale] = value[locale]
                    }
                  }
                  result[tab.name] = filtered
                } else {
                  // Non-localized tab
                  result[tab.name] = filterDataToSelectedLocales({
                    configBlockReferences,
                    docWithLocales: value as JsonObject,
                    fields: tab.fields,
                    parentIsLocalized: tabIsLocalized,
                    selectedLocales,
                  })
                }
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
