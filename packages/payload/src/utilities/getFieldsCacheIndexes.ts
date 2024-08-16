import { type Field, tabHasName } from '../fields/config/types.js'

export const getFieldsCacheIndexes = (fields: Field[]) => {
  let cacheIndexes: string[] = []

  fields.forEach((field) => {
    if ('cacheIndex' in field && 'name' in field && field.cacheIndex) {
      cacheIndexes.push(field.name)
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      cacheIndexes = [...cacheIndexes, ...getFieldsCacheIndexes(field.fields)]
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        if (tabHasName(tab)) return
        cacheIndexes = [...cacheIndexes, ...getFieldsCacheIndexes(tab.fields)]
      })
    }
  })

  return cacheIndexes
}
