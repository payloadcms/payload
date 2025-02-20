import type { ArrayFieldClient, BlocksFieldClient, ClientConfig, ClientField } from 'payload'

import { fieldShouldBeLocalized } from 'payload/shared'

import { fieldHasChanges } from './fieldHasChanges.js'
import { getFieldsForRowComparison } from './getFieldsForRowComparison.js'

type Args = {
  comparison: unknown
  config: ClientConfig
  fields: ClientField[]
  locales: string[] | undefined
  parentIsLocalized: boolean
  version: unknown
}

/**
 * Recursively counts the number of changed fields between comparison and
 * version data for a given set of fields.
 */
export function countChangedFields({
  comparison,
  config,
  fields,
  locales,
  parentIsLocalized,
  version,
}: Args) {
  let count = 0

  fields.forEach((field) => {
    // Don't count the id field since it is not displayed in the UI
    if ('name' in field && field.name === 'id') {
      return
    }
    const fieldType = field.type
    switch (fieldType) {
      // Iterable fields are arrays and blocks fields. We iterate over each row and
      // count the number of changed fields in each.
      case 'array':
      case 'blocks': {
        if (locales && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          locales.forEach((locale) => {
            const comparisonRows = comparison?.[field.name]?.[locale] ?? []
            const versionRows = version?.[field.name]?.[locale] ?? []
            count += countChangedFieldsInRows({
              comparisonRows,
              config,
              field,
              locales,
              parentIsLocalized: parentIsLocalized || field.localized,
              versionRows,
            })
          })
        } else {
          const comparisonRows = comparison?.[field.name] ?? []
          const versionRows = version?.[field.name] ?? []
          count += countChangedFieldsInRows({
            comparisonRows,
            config,
            field,
            locales,
            parentIsLocalized: parentIsLocalized || field.localized,
            versionRows,
          })
        }
        break
      }

      // Regular fields without nested fields.
      case 'checkbox':
      case 'code':
      case 'date':
      case 'email':
      case 'join':
      case 'json':
      case 'number':
      case 'point':
      case 'radio':
      case 'relationship':
      case 'richText':
      case 'select':
      case 'text':
      case 'textarea':
      case 'upload': {
        // Fields that have a name and contain data. We can just check if the data has changed.
        if (locales && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          locales.forEach((locale) => {
            if (
              fieldHasChanges(version?.[field.name]?.[locale], comparison?.[field.name]?.[locale])
            ) {
              count++
            }
          })
        } else if (fieldHasChanges(version?.[field.name], comparison?.[field.name])) {
          count++
        }
        break
      }
      // Fields that have nested fields, but don't nest their fields' data.
      case 'collapsible':
      case 'row': {
        count += countChangedFields({
          comparison,
          config,
          fields: field.fields,
          locales,
          parentIsLocalized: parentIsLocalized || field.localized,
          version,
        })

        break
      }

      // Fields that have nested fields and nest their fields' data.
      case 'group': {
        if (locales && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          locales.forEach((locale) => {
            count += countChangedFields({
              comparison: comparison?.[field.name]?.[locale],
              config,
              fields: field.fields,
              locales,
              parentIsLocalized: parentIsLocalized || field.localized,
              version: version?.[field.name]?.[locale],
            })
          })
        } else {
          count += countChangedFields({
            comparison: comparison?.[field.name],
            config,
            fields: field.fields,
            locales,
            parentIsLocalized: parentIsLocalized || field.localized,
            version: version?.[field.name],
          })
        }
        break
      }

      // Each tab in a tabs field has nested fields. The fields data may be
      // nested or not depending on the existence of a name property.
      case 'tabs': {
        field.tabs.forEach((tab) => {
          if ('name' in tab && locales && tab.localized) {
            // Named localized tab
            locales.forEach((locale) => {
              count += countChangedFields({
                comparison: comparison?.[tab.name]?.[locale],
                config,
                fields: tab.fields,
                locales,
                parentIsLocalized: parentIsLocalized || tab.localized,
                version: version?.[tab.name]?.[locale],
              })
            })
          } else if ('name' in tab) {
            // Named tab
            count += countChangedFields({
              comparison: comparison?.[tab.name],
              config,
              fields: tab.fields,
              locales,
              parentIsLocalized: parentIsLocalized || tab.localized,
              version: version?.[tab.name],
            })
          } else {
            // Unnamed tab
            count += countChangedFields({
              comparison,
              config,
              fields: tab.fields,
              locales,
              parentIsLocalized: parentIsLocalized || tab.localized,
              version,
            })
          }
        })
        break
      }

      // UI fields don't have data and are not displayed in the version view
      // so we can ignore them.
      case 'ui': {
        break
      }

      default: {
        const _exhaustiveCheck: never = fieldType
        throw new Error(`Unexpected field.type in countChangedFields : ${String(fieldType)}`)
      }
    }
  })

  return count
}

type countChangedFieldsInRowsArgs = {
  comparisonRows: unknown[]
  config: ClientConfig
  field: ArrayFieldClient | BlocksFieldClient
  locales: string[] | undefined
  parentIsLocalized: boolean
  versionRows: unknown[]
}

export function countChangedFieldsInRows({
  comparisonRows = [],
  config,
  field,
  locales,
  parentIsLocalized,
  versionRows = [],
}: countChangedFieldsInRowsArgs) {
  let count = 0
  let i = 0

  while (comparisonRows[i] || versionRows[i]) {
    const comparisonRow = comparisonRows?.[i] || {}
    const versionRow = versionRows?.[i] || {}

    const { fields: rowFields } = getFieldsForRowComparison({
      baseVersionField: { type: 'text', fields: [], path: '', schemaPath: '' }, // Doesn't matter, as we don't need the versionFields output here
      comparisonRow,
      config,
      field,
      row: i,
      versionRow,
    })

    count += countChangedFields({
      comparison: comparisonRow,
      config,
      fields: rowFields,
      locales,
      parentIsLocalized: parentIsLocalized || field.localized,
      version: versionRow,
    })

    i++
  }
  return count
}
