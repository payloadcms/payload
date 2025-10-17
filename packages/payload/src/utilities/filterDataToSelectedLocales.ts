import type { Field, FlattenedBlock } from '../fields/config/types.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../fields/config/types.js'

type FilterDataToSelectedLocalesArgs = {
  data: JsonObject
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
  data,
  fields,
  parentIsLocalized = false,
  selectedLocales,
}: FilterDataToSelectedLocalesArgs): JsonObject {
  if (!data || typeof data !== 'object') {
    return data
  }

  const result: JsonObject = {}

  for (const field of fields) {
    if (fieldAffectsData(field)) {
      const fieldIsLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

      switch (field.type) {
        case 'array': {
          if (Array.isArray(data[field.name])) {
            result[field.name] = data[field.name].map((item: JsonObject) =>
              filterDataToSelectedLocales({
                data: item,
                fields: field.fields,
                parentIsLocalized: fieldIsLocalized,
                selectedLocales,
              }),
            )
          }
          break
        }

        case 'blocks': {
          if (field.name in data && Array.isArray(data[field.name])) {
            result[field.name] = data[field.name].map((blockData: JsonObject) => {
              // Find the block definition
              const blockDefinition =
                field.blockReferences?.find(
                  (block) => typeof block !== 'string' && block.slug === blockData.blockType,
                ) ??
                field.blocks?.find(
                  (block) => typeof block !== 'string' && block.slug === blockData.blockType,
                )

              if (blockDefinition && typeof blockDefinition !== 'string') {
                return filterDataToSelectedLocales({
                  data: blockData,
                  fields: (blockDefinition as FlattenedBlock).fields,
                  parentIsLocalized: fieldIsLocalized,
                  selectedLocales,
                })
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
            field.name in data &&
            typeof data[field.name] === 'object'
          ) {
            result[field.name] = filterDataToSelectedLocales({
              data: data[field.name] as JsonObject,
              fields: field.fields,
              parentIsLocalized: fieldIsLocalized,
              selectedLocales,
            })
          } else {
            // Unnamed groups pass through the same data level
            const nestedResult = filterDataToSelectedLocales({
              data,
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
          if (field.name in data) {
            const value = data[field.name]

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
            data,
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
              if (tab.name in data && typeof data[tab.name] === 'object') {
                result[tab.name] = filterDataToSelectedLocales({
                  data: data[tab.name] as JsonObject,
                  fields: tab.fields,
                  parentIsLocalized,
                  selectedLocales,
                })
              }
            } else {
              // Unnamed tabs pass through the same data level
              const nestedResult = filterDataToSelectedLocales({
                data,
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
