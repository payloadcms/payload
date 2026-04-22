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
 * Filters a locale map to selected locales and applies a transform to each locale's value.
 */
function filterLocaleMap(
  localeMap: Record<string, unknown>,
  selectedLocales: string[],
  transform: (value: unknown) => unknown,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {}
  const localesToInclude =
    selectedLocales && selectedLocales.length > 0 ? selectedLocales : Object.keys(localeMap)

  for (const locale of localesToInclude) {
    if (locale in localeMap) {
      filtered[locale] = transform(localeMap[locale])
    }
  }

  return Object.keys(filtered).length > 0 ? filtered : {}
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
          if (!(field.name in docWithLocales)) {
            break
          }

          const arrayValue = docWithLocales[field.name]

          if (fieldIsLocalized) {
            if (arrayValue && typeof arrayValue === 'object' && !Array.isArray(arrayValue)) {
              result[field.name] = filterLocaleMap(arrayValue, selectedLocales, (localeRows) =>
                Array.isArray(localeRows)
                  ? localeRows.map((item: JsonObject) =>
                      filterDataToSelectedLocales({
                        configBlockReferences,
                        docWithLocales: item,
                        fields: field.fields,
                        parentIsLocalized: fieldIsLocalized,
                        selectedLocales,
                      }),
                    )
                  : localeRows,
              )
            }
          } else if (Array.isArray(arrayValue)) {
            result[field.name] = arrayValue.map((item: JsonObject) =>
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
          if (!(field.name in docWithLocales)) {
            break
          }

          const blocksValue = docWithLocales[field.name]

          const processBlockRows = (rows: unknown): unknown => {
            if (!Array.isArray(rows)) {
              return rows
            }

            return rows.map((blockData: JsonObject) => {
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

                // blockType, id, blockName are set by Payload internally
                // and not part of block.fields, so they must be preserved explicitly
                filtered.blockType = blockData.blockType
                filtered.id = blockData.id
                filtered.blockName = blockData.blockName

                return filtered
              }

              return blockData
            })
          }

          if (fieldIsLocalized) {
            if (blocksValue && typeof blocksValue === 'object' && !Array.isArray(blocksValue)) {
              result[field.name] = filterLocaleMap(blocksValue, selectedLocales, (localeRows) =>
                processBlockRows(localeRows),
              )
            }
          } else if (Array.isArray(blocksValue)) {
            result[field.name] = processBlockRows(blocksValue)
          }

          break
        }

        case 'group': {
          if (field.name in docWithLocales && typeof docWithLocales[field.name] === 'object') {
            const groupValue = docWithLocales[field.name]

            if (fieldIsLocalized) {
              if (groupValue && typeof groupValue === 'object' && !Array.isArray(groupValue)) {
                result[field.name] = filterLocaleMap(groupValue, selectedLocales, (localeValue) => {
                  if (
                    localeValue &&
                    typeof localeValue === 'object' &&
                    !Array.isArray(localeValue)
                  ) {
                    return filterDataToSelectedLocales({
                      configBlockReferences,
                      docWithLocales: localeValue as JsonObject,
                      fields: field.fields,
                      parentIsLocalized: fieldIsLocalized,
                      selectedLocales,
                    })
                  }
                  return localeValue
                })
              }
            } else if (typeof groupValue === 'object' && !Array.isArray(groupValue)) {
              result[field.name] = filterDataToSelectedLocales({
                configBlockReferences,
                docWithLocales: groupValue as JsonObject,
                fields: field.fields,
                parentIsLocalized: fieldIsLocalized,
                selectedLocales,
              })
            }
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
          if (field.name in docWithLocales) {
            const value = docWithLocales[field.name]

            if (fieldIsLocalized) {
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[field.name] = filterLocaleMap(
                  value,
                  selectedLocales,
                  (localeValue) => localeValue,
                )
              }
            } else {
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
