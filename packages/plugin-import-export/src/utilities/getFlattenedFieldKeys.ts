import { type FlattenedField } from 'payload'

type FieldWithPresentational =
  | {
      fields?: FlattenedField[]
      name?: string
      tabs?: {
        fields: FlattenedField[]
        name?: string
      }[]
      type: 'collapsible' | 'row' | 'tabs'
    }
  | FlattenedField

export const getFlattenedFieldKeys = (fields: FieldWithPresentational[], prefix = ''): string[] => {
  const keys: string[] = []

  fields.forEach((field) => {
    const fieldHasToCSVFunction =
      'custom' in field &&
      typeof field.custom === 'object' &&
      'plugin-import-export' in field.custom &&
      field.custom['plugin-import-export']?.toCSV

    if (!('name' in field) || typeof field.name !== 'string' || fieldHasToCSVFunction) {
      return
    }

    const name = prefix ? `${prefix}_${field.name}` : field.name

    switch (field.type) {
      case 'array': {
        const subKeys = getFlattenedFieldKeys(field.fields as FlattenedField[], `${name}_0`)
        keys.push(...subKeys)
        break
      }
      case 'blocks':
        field.blocks.forEach((block) => {
          const blockKeys = getFlattenedFieldKeys(block.fields as FlattenedField[], `${name}_0`)
          keys.push(...blockKeys)
        })
        break
      case 'collapsible':
      case 'group':
      case 'row':
        keys.push(...getFlattenedFieldKeys(field.fields as FlattenedField[], name))
        break
      case 'relationship':
        if (field.hasMany) {
          if (Array.isArray(field.relationTo)) {
            // hasMany polymorphic
            keys.push(`${name}_0_relationTo`, `${name}_0_id`)
          } else {
            // hasMany monomorphic
            keys.push(`${name}_0`)
          }
        } else {
          if (Array.isArray(field.relationTo)) {
            // hasOne polymorphic
            keys.push(`${name}_relationTo`, `${name}_id`)
          } else {
            // hasOne monomorphic
            keys.push(name)
          }
        }
        break
      case 'tabs':
        if (field.tabs) {
          field.tabs.forEach((tab) => {
            if (tab.name) {
              const tabPrefix = prefix ? `${prefix}_${tab.name}` : tab.name
              keys.push(...getFlattenedFieldKeys(tab.fields, tabPrefix))
            } else {
              keys.push(...getFlattenedFieldKeys(tab.fields, prefix))
            }
          })
        }
        break
      default:
        if ('hasMany' in field && field.hasMany) {
          // Push placeholder for first index
          keys.push(`${name}_0`)
        } else {
          keys.push(name)
        }
        break
    }
  })

  return keys
}
