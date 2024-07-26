import type { FieldMap } from 'payload'

export const buildPathSegments = (parentPath: string, fieldMap: FieldMap): string[] => {
  const pathNames = fieldMap.reduce((acc, field) => {
    const fieldMap =
      'fieldMap' in field.fieldComponentProps ? field.fieldComponentProps.fieldMap : undefined

    if (fieldMap) {
      if (field.isFieldAffectingData) {
        // group, block, array
        const name = 'name' in field ? field.name : 'unnamed'
        acc.push(parentPath ? `${parentPath}.${name}.` : `${name}.`)
      } else {
        // rows, collapsibles, unnamed-tab
        acc.push(...buildPathSegments(parentPath, fieldMap))
      }
    } else if (field.type === 'tabs') {
      // tabs
      if ('tabs' in field.fieldComponentProps) {
        field.fieldComponentProps.tabs?.forEach((tab) => {
          let tabPath = parentPath
          if ('name' in tab) {
            tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name
          }
          acc.push(...buildPathSegments(tabPath, tab.fieldMap))
        })
      }
    } else if (field.isFieldAffectingData) {
      // text, number, date, etc.
      const name = 'name' in field ? field.name : 'unnamed'
      acc.push(parentPath ? `${parentPath}.${name}` : name)
    }

    return acc
  }, [])

  return pathNames
}
