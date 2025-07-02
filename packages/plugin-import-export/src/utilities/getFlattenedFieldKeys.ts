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
    if (!('name' in field) || typeof field.name !== 'string') {
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
          // e.g. hasManyPolymorphic_0_value_id
          keys.push(`${name}_0_relationTo`, `${name}_0_value_id`)
        } else {
          // e.g. hasOnePolymorphic_id
          keys.push(`${name}_id`, `${name}_relationTo`)
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
