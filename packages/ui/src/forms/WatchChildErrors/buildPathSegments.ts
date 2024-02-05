import { FieldMap } from '../utilities/buildComponentMap/types'

export const buildPathSegments = (parentPath: string, fieldMap: FieldMap): string[] => {
  const pathNames = fieldMap.reduce((acc, subField) => {
    if (subField.subfields && subField.isFieldAffectingData) {
      // group, block, array
      acc.push(parentPath ? `${parentPath}.${subField.name}.` : `${subField.name}.`)
    } else if (subField.subfields) {
      // rows, collapsibles, unnamed-tab
      acc.push(...buildPathSegments(parentPath, subField.subfields))
    } else if (subField.type === 'tabs') {
      // tabs
      subField.tabs.forEach((tab) => {
        let tabPath = parentPath
        if ('name' in tab) {
          tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name
        }
        acc.push(...buildPathSegments(tabPath, tab.subfields))
      })
    } else if (subField.isFieldAffectingData) {
      // text, number, date, etc.
      acc.push(parentPath ? `${parentPath}.${subField.name}` : subField.name)
    }

    return acc
  }, [])

  return pathNames
}
