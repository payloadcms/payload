import type { ClientField } from 'payload'

import { getFieldsForRowComparison } from '../fields/Iterable/getFieldsForRowComparison.js'
import { fieldHasChanges } from './fieldHasChanges.js'

type Args = {
  comparison: unknown
  fields: ClientField[]
  version: unknown
}

/**
 * Recursively counts the number of changed fields between comparison and
 * version data for a given set of fields.
 */
export function countChangedFields({ comparison, fields, version }: Args) {
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
        const iterableComparison = comparison?.[field.name] ?? []
        const iterableVersion = version?.[field.name] ?? []

        let i = 0
        while (iterableComparison[i] || iterableVersion[i]) {
          const comparisonRow = iterableComparison?.[i] || {}
          const versionRow = iterableVersion?.[i] || {}

          const rowFields = getFieldsForRowComparison({
            comparisonRow,
            field,
            versionRow,
          })

          count += countChangedFields({
            comparison: comparisonRow,
            fields: rowFields,
            version: versionRow,
          })

          i++
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
        if (fieldHasChanges(version?.[field.name], comparison?.[field.name])) {
          count++
        }
        break
      }
      // Fields that have nested fields, but don't nest their fields' data.
      case 'collapsible':
      case 'row': {
        count += countChangedFields({
          comparison,
          fields: field.fields,
          version,
        })

        break
      }

      // Fields that have nested fields and nest their fields' data.
      case 'group': {
        count += countChangedFields({
          comparison: comparison?.[field.name],
          fields: field.fields,
          version: version?.[field.name],
        })
        break
      }

      // Each tab in a tabs field has nested fields. The fields data may be
      // nested or not depending on the existence of a name property.
      case 'tabs': {
        field.tabs.forEach((tab) => {
          count += countChangedFields({
            comparison: 'name' in tab ? comparison?.[tab.name] : comparison,
            fields: tab.fields,
            version: 'name' in tab ? version?.[tab.name] : version,
          })
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
