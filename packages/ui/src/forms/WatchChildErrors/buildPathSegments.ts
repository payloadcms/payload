import type { FieldMap } from '../../utilities/buildComponentMap/types.js'

export const buildPathSegments = (parentPath: string, fieldMap: FieldMap): string[] => {
  const pathNames = fieldMap.reduce((acc, subField) => {
    if ('fieldMap' in subField) {
      if (subField.fieldMap && subField.isFieldAffectingData) {
        // group, block, array
        const name = 'name' in subField ? subField.name : 'unnamed'
        acc.push(parentPath ? `${parentPath}.${name}.` : `${name}.`)
      } else if (subField.fieldMap) {
        // rows, collapsibles, unnamed-tab
        acc.push(...buildPathSegments(parentPath, subField.fieldMap))
      } else if (subField.type === 'tabs') {
        // tabs
        'tabs' in subField &&
          subField.tabs?.forEach((tab) => {
            let tabPath = parentPath
            if ('name' in tab) {
              tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name
            }
            acc.push(...buildPathSegments(tabPath, tab.fieldMap))
          })
      } else if (subField.isFieldAffectingData) {
        // text, number, date, etc.
        const name = 'name' in subField ? subField.name : 'unnamed'
        acc.push(parentPath ? `${parentPath}.${name}` : name)
      }
    }

    return acc
  }, [])

  return pathNames
}
