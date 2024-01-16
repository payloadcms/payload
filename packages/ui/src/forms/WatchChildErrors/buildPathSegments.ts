import type { Field, TabAsField } from 'payload/types'

import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/types'

export const buildPathSegments = (parentPath: string, fieldSchema: Field[]): string[] => {
  const pathNames = fieldSchema.reduce((acc, subField) => {
    if (fieldHasSubFields(subField) && fieldAffectsData(subField)) {
      // group, block, array
      acc.push(parentPath ? `${parentPath}.${subField.name}.` : `${subField.name}.`)
    } else if (fieldHasSubFields(subField)) {
      // rows, collapsibles, unnamed-tab
      acc.push(...buildPathSegments(parentPath, subField.fields))
    } else if (subField.type === 'tabs') {
      // tabs
      subField.tabs.forEach((tab: TabAsField) => {
        let tabPath = parentPath
        if (tabHasName(tab)) {
          tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name
        }
        acc.push(...buildPathSegments(tabPath, tab.fields))
      })
    } else if (fieldAffectsData(subField)) {
      // text, number, date, etc.
      acc.push(parentPath ? `${parentPath}.${subField.name}` : subField.name)
    }

    return acc
  }, [])

  return pathNames
}
