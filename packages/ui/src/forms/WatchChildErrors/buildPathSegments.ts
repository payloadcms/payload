import type { ClientFieldConfig } from 'payload'

export const buildPathSegments = (parentPath: string, fields: ClientFieldConfig[]): string[] => {
  const pathNames = fields.reduce((acc, field) => {
    const fields = 'fields' in field ? field.fields : undefined

    if (fields) {
      if (field._isFieldAffectingData) {
        // group, block, array
        const name = 'name' in field ? field.name : 'unnamed'
        acc.push(parentPath ? `${parentPath}.${name}.` : `${name}.`)
      } else {
        // rows, collapsibles, unnamed-tab
        acc.push(...buildPathSegments(parentPath, fields))
      }
    } else if (field.type === 'tabs') {
      // tabs
      if ('tabs' in field) {
        field.tabs?.forEach((tab) => {
          let tabPath = parentPath
          if ('name' in tab) {
            tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name
          }
          acc.push(...buildPathSegments(tabPath, tab.fields))
        })
      }
    } else if (field._isFieldAffectingData) {
      // text, number, date, etc.
      const name = 'name' in field ? field.name : 'unnamed'
      acc.push(parentPath ? `${parentPath}.${name}` : name)
    }

    return acc
  }, [])

  return pathNames
}
