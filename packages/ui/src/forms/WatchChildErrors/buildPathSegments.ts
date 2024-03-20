import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'

export const buildPathSegments = (parentPath: string, fieldMap: FieldMap): string[] => {
  const pathNames = fieldMap.reduce((acc, subField) => {
    if ('fieldMap' in subField.fieldComponentProps) {
      const fieldMap = subField.fieldComponentProps.fieldMap

      if (fieldMap && subField.isFieldAffectingData) {
        // group, block, array
        const name = 'name' in subField ? subField.name : 'unnamed'
        acc.push(parentPath ? `${parentPath}.${name}.` : `${name}.`)
      } else if (fieldMap) {
        // rows, collapsibles, unnamed-tab
        acc.push(...buildPathSegments(parentPath, fieldMap))
      } else if (subField.type === 'tabs') {
        // tabs
        'tabs' in subField.fieldComponentProps &&
          subField.fieldComponentProps?.tabs?.forEach((tab) => {
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
