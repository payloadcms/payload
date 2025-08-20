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

    const name = 'name' in field && typeof field.name === 'string' ? field.name : undefined
    const fullKey = name && prefix ? `${prefix}_${name}` : (name ?? prefix)

    switch (field.type) {
      case 'array': {
        const subKeys = getFlattenedFieldKeys(field.fields as FlattenedField[], `${fullKey}_0`)
        keys.push(...subKeys)
        break
      }
      case 'blocks': {
        field.blocks.forEach((block) => {
          const blockPrefix = `${fullKey}_0_${block.slug}`
          keys.push(`${blockPrefix}_blockType`)
          keys.push(`${blockPrefix}_id`)
          keys.push(...getFlattenedFieldKeys(block.fields as FlattenedField[], blockPrefix))
        })
        break
      }
      case 'collapsible':
      case 'group':
      case 'row':
        keys.push(...getFlattenedFieldKeys(field.fields as FlattenedField[], fullKey))
        break
      case 'relationship':
        if (field.hasMany) {
          if (Array.isArray(field.relationTo)) {
            // hasMany polymorphic
            keys.push(`${fullKey}_0_relationTo`, `${fullKey}_0_id`)
          } else {
            // hasMany monomorphic
            keys.push(`${fullKey}_0_id`)
          }
        } else {
          if (Array.isArray(field.relationTo)) {
            // hasOne polymorphic
            keys.push(`${fullKey}_relationTo`, `${fullKey}_id`)
          } else {
            // hasOne monomorphic
            keys.push(fullKey)
          }
        }
        break
      case 'tabs':
        field.tabs?.forEach((tab) => {
          const tabPrefix = tab.name ? `${fullKey}_${tab.name}` : fullKey
          keys.push(...getFlattenedFieldKeys(tab.fields || [], tabPrefix))
        })
        break
      default:
        if (!name || fieldHasToCSVFunction) {
          break
        }
        if ('hasMany' in field && field.hasMany) {
          // Push placeholder for first index
          keys.push(`${fullKey}_0`)
        } else {
          keys.push(fullKey)
        }
        break
    }
  })

  return keys
}
