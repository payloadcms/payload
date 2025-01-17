import type { ClientField } from 'payload'

// import { UnreachableCaseError } from 'payload'
import { hasChanges } from './hasChanges.js'

type Args = {
  comparison: unknown
  fields: ClientField[]
  version: unknown
}

/**
 * Counts the number of fields that have changed between the version and comparison.
 * It only counts immediate children fields, not nested fields. Nested fields
 * are considered those displayed inside a FieldDiffCollapser, inluding those
 * not nested in the data structure
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
      case 'array':
      case 'blocks':
      case 'checkbox':
      case 'code':
      case 'date':
      case 'email':
      case 'group':
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
        if (hasChanges(version?.[field.name], comparison?.[field.name])) {
          count++
        }
        return
      }
      case 'collapsible': {
        // Collapsible fields don't have a name or nest their fields' data, but we show them in a
        // FieldDiffCollapser, so we increment the count if any of it's fields have changed.
        if (
          countChangedFields({
            comparison,
            fields: field.fields,
            version,
          }) > 0
        ) {
          count++
        }
        return
      }
      case 'row': {
        // Rows don't have nest their fields' data and we don't show them in a
        // FieldDiffCollapser so we add every changed field to the count.
        count += countChangedFields({
          comparison,
          fields: field.fields,
          version,
        })
        return
      }
      case 'tabs': {
        // The tabs field is not displayed in the UI, but each of its tabs are.
        // Each tab is displayed in a FieldDiffCollapser, so increment the count
        // for each tab if any of the tab fields has changed.
        field.tabs.forEach((tab) => {
          const tabFieldsChangeCount = countChangedFields({
            comparison: 'name' in tab ? comparison?.[tab.name] : comparison,
            fields: tab.fields,
            version: 'name' in tab ? version?.[tab.name] : version,
          })

          if (tabFieldsChangeCount > 0) {
            count++
          }
        })
        return
      }
      case 'ui': {
        // UI fields don't have data and are not displayed in the version view
        // so we can ignore them.
        return
      }
      default: {
        const _exhaustiveCheck: never = fieldType
        throw new Error(`Unhandled field.type in countChangedFields : ${String(fieldType)}`)
      }
    }
  })

  return count
}
