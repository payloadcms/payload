import type { Block, Field, FlattenedBlock } from '../fields/config/types.js'
import type { SanitizedConfig } from '../index.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../fields/config/types.js'

/**
 * Collects field names at the current data level, recursing through pass-through fields
 * (row, collapsible, unnamed group, unnamed tab) but stopping at named fields.
 */
function collectFlattenedFieldNames(fields: Field[]): Set<string> {
  const names = new Set<string>()
  for (const field of fields) {
    if (fieldAffectsData(field)) {
      names.add(field.name)
    } else if ('fields' in field && Array.isArray(field.fields)) {
      // Pass-through fields (row, collapsible, unnamed group)
      for (const name of collectFlattenedFieldNames(field.fields)) {
        names.add(name)
      }
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (tabHasName(tab)) {
          names.add(tab.name)
        } else {
          for (const name of collectFlattenedFieldNames(tab.fields)) {
            names.add(name)
          }
        }
      }
    }
  }
  return names
}

type MergeDataToSelectedLocalesArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  dataWithLocales: JsonObject
  docWithLocales: JsonObject
  fields: Field[]
  parentIsLocalized?: boolean
  selectedLocales: string[]
}

/**
 * Merges data from dataWithLocales onto docWithLocales for specified locales.
 * For localized fields, merges only the specified locales while preserving others.
 * For non-localized fields, keeps existing values from docWithLocales unchanged.
 * Returns a new object without mutating the original.
 */
export function mergeLocalizedData({
  configBlockReferences,
  dataWithLocales,
  docWithLocales,
  fields,
  parentIsLocalized = false,
  selectedLocales,
}: MergeDataToSelectedLocalesArgs): JsonObject {
  if (!docWithLocales || typeof docWithLocales !== 'object') {
    return dataWithLocales || docWithLocales
  }

  const result: JsonObject = { ...docWithLocales }

  for (const field of fields) {
    if (fieldAffectsData(field)) {
      // If the parent is localized, all children are inherently "localized"
      if (parentIsLocalized && dataWithLocales[field.name]) {
        result[field.name] = dataWithLocales[field.name]
        continue
      }

      const fieldIsLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

      switch (field.type) {
        case 'array': {
          if (field.name in dataWithLocales) {
            const newValue = dataWithLocales[field.name]
            const existingValue = docWithLocales[field.name]

            if (fieldIsLocalized) {
              // If localized, handle locale keys
              if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
                const updatedArray: Record<string, unknown> = { ...(existingValue || {}) }

                for (const locale of selectedLocales) {
                  if (locale in newValue) {
                    updatedArray[locale] = newValue[locale]
                  }
                }

                result[field.name] = updatedArray
              } else {
                // Preserve existing value if new value is not a valid object
                result[field.name] = existingValue
              }
            } else if (Array.isArray(newValue)) {
              // Non-localized array - still process children for any localized fields
              result[field.name] = newValue.map((newItem: JsonObject, index: number) => {
                const existingItem = existingValue?.[index] || {}

                return mergeLocalizedData({
                  configBlockReferences,
                  dataWithLocales: newItem,
                  docWithLocales: existingItem,
                  fields: field.fields,
                  parentIsLocalized,
                  selectedLocales,
                })
              })
            }
          }
          break
        }

        case 'blocks': {
          if (field.name in dataWithLocales) {
            const newValue = dataWithLocales[field.name]
            const existingValue = docWithLocales[field.name]

            if (fieldIsLocalized) {
              // If localized, handle locale keys
              if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
                const updatedData: Record<string, unknown> = { ...(existingValue || {}) }

                for (const locale of selectedLocales) {
                  if (locale in newValue) {
                    updatedData[locale] = newValue[locale]
                  }
                }

                result[field.name] = updatedData
              } else {
                // Preserve existing value if new value is not a valid object
                result[field.name] = existingValue
              }
            } else if (Array.isArray(newValue)) {
              // Non-localized blocks - still process children for any localized fields
              result[field.name] = newValue.map((newBlockData: JsonObject, index: number) => {
                let block: Block | FlattenedBlock | undefined
                if (configBlockReferences && field.blockReferences) {
                  for (const blockOrReference of field.blockReferences) {
                    if (typeof blockOrReference === 'string') {
                      block = configBlockReferences.find((b) => b.slug === newBlockData.blockType)
                    } else {
                      block = blockOrReference
                    }
                  }
                } else if (field.blocks) {
                  block = field.blocks.find((b) => b.slug === newBlockData.blockType)
                }

                if (block) {
                  const blockData =
                    Array.isArray(existingValue) && existingValue[index]
                      ? (existingValue[index] as JsonObject)
                      : {}

                  const merged = mergeLocalizedData({
                    configBlockReferences,
                    dataWithLocales: newBlockData,
                    docWithLocales: blockData,
                    fields: block?.fields || [],
                    parentIsLocalized,
                    selectedLocales,
                  })

                  // Preserve block metadata not in block.fields
                  // (blockType, id, blockName are set by Payload internally)
                  if (newBlockData.blockType) {
                    merged.blockType = newBlockData.blockType
                  }
                  if (newBlockData.id) {
                    merged.id = newBlockData.id
                  }
                  if (newBlockData.blockName !== undefined) {
                    merged.blockName = newBlockData.blockName
                  }

                  return merged
                }

                return newBlockData
              })
            }
          }
          break
        }

        case 'group': {
          if (fieldAffectsData(field) && field.name) {
            // Named groups create a nested data structure
            if (field.name in dataWithLocales) {
              const newValue = dataWithLocales[field.name]
              const existingValue = docWithLocales[field.name]

              if (fieldIsLocalized) {
                if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
                  const groupData: Record<string, unknown> = { ...(existingValue || {}) }

                  for (const locale of selectedLocales) {
                    if (locale in newValue && typeof newValue[locale] === 'object') {
                      groupData[locale] = newValue[locale]
                    }
                  }

                  result[field.name] = groupData
                } else {
                  // Preserve existing value if new value is not a valid object
                  result[field.name] = existingValue
                }
              } else if (typeof newValue === 'object' && !Array.isArray(newValue)) {
                // Non-localized group - still process children for any localized fields
                result[field.name] = mergeLocalizedData({
                  configBlockReferences,
                  dataWithLocales: newValue,
                  docWithLocales: existingValue || {},
                  fields: field.fields,
                  parentIsLocalized,
                  selectedLocales,
                })
              }
            }
          }
          break
        }

        default: {
          // For all other data-affecting fields (text, number, select, etc.)
          if (fieldIsLocalized) {
            if (field.name in dataWithLocales) {
              const newValue = dataWithLocales[field.name]
              const existingValue = docWithLocales[field.name] || {}

              // If localized, handle locale keys
              if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
                const merged: Record<string, unknown> = { ...existingValue }

                for (const locale of selectedLocales) {
                  if (locale in newValue) {
                    merged[locale] = newValue[locale]
                  }
                }

                result[field.name] = merged
              } else if (parentIsLocalized) {
                // Child of localized parent - replace with new value
                result[field.name] = newValue
              } else {
                // Preserve existing value if new value is not a valid object
                result[field.name] = existingValue
              }
            }
          } else if (parentIsLocalized) {
            result[field.name] = dataWithLocales[field.name]
          } else {
            result[field.name] =
              field.name in dataWithLocales
                ? dataWithLocales[field.name]
                : docWithLocales[field.name]
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
          const merged = mergeLocalizedData({
            configBlockReferences,
            dataWithLocales,
            docWithLocales,
            fields: field.fields,
            parentIsLocalized,
            selectedLocales,
          })
          // Only copy fields that belong to this layout field to avoid overwriting already-processed fields
          const fieldNames = collectFlattenedFieldNames(field.fields)
          for (const name of fieldNames) {
            if (name in merged) {
              result[name] = merged[name]
            }
          }
          break
        }

        case 'tabs': {
          for (const tab of field.tabs) {
            if (tabHasName(tab)) {
              // Named tabs create a nested data structure and can be localized
              const tabIsLocalized = fieldShouldBeLocalized({ field: tab, parentIsLocalized })

              if (tab.name in dataWithLocales) {
                const newValue = dataWithLocales[tab.name]
                const existingValue = docWithLocales[tab.name]

                if (tabIsLocalized) {
                  if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
                    const merged: Record<string, unknown> = { ...(existingValue || {}) }

                    for (const locale of selectedLocales) {
                      if (locale in newValue && typeof newValue[locale] === 'object') {
                        merged[locale] = newValue[locale]
                      }
                    }

                    result[tab.name] = merged
                  } else {
                    // Preserve existing value if new value is not a valid object
                    result[tab.name] = existingValue
                  }
                } else if (typeof newValue === 'object' && !Array.isArray(newValue)) {
                  // Non-localized tab - still process children for any localized fields
                  result[tab.name] = mergeLocalizedData({
                    configBlockReferences,
                    dataWithLocales: newValue as JsonObject,
                    docWithLocales: existingValue || {},
                    fields: tab.fields,
                    parentIsLocalized,
                    selectedLocales,
                  })
                }
              }
            } else {
              // Unnamed tabs pass through the same data level
              const merged = mergeLocalizedData({
                configBlockReferences,
                dataWithLocales,
                docWithLocales,
                fields: tab.fields,
                parentIsLocalized,
                selectedLocales,
              })
              // Only copy fields that belong to this tab to avoid overwriting already-processed fields
              const tabFieldNames = collectFlattenedFieldNames(tab.fields)
              for (const name of tabFieldNames) {
                if (name in merged) {
                  result[name] = merged[name]
                }
              }
            }
          }
          break
        }
      }
    }
  }

  return result
}
