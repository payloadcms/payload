import type { ClientField } from 'payload'

export const traverseForLocalizedFields = (fields: ClientField[]): boolean => {
  for (const field of fields) {
    if ('localized' in field && field.localized) {
      return true
    }

    switch (field.type) {
      case 'array':
      case 'collapsible':
      case 'group':
      case 'row':
        if (field.fields && traverseForLocalizedFields(field.fields)) {
          return true
        }
        break

      case 'blocks':
        if (field.blocks) {
          for (const block of field.blocks) {
            if (block.fields && traverseForLocalizedFields(block.fields)) {
              return true
            }
          }
        }
        break

      case 'tabs':
        if (field.tabs) {
          for (const tab of field.tabs) {
            if ('localized' in tab && tab.localized) {
              return true
            }
            if ('fields' in tab && tab.fields && traverseForLocalizedFields(tab.fields)) {
              return true
            }
          }
        }
        break
    }
  }

  return false
}
