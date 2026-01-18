import { type FlattenedField } from '@ruya.sa/payload'

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

export type GetFlattenedFieldKeysOptions = {
  /**
   * When provided, localized fields will be expanded to include locale suffixes.
   * e.g., 'title' (localized) -> ['title_en', 'title_es']
   */
  localeCodes?: string[]
}

/**
 * Recursively traverses fields and generates flattened CSV column keys.
 * This is schema-based - it derives columns from field definitions, not data.
 */
export const getFlattenedFieldKeys = (
  fields: FieldWithPresentational[],
  prefix = '',
  options: GetFlattenedFieldKeysOptions = {},
): string[] => {
  const { localeCodes } = options
  const keys: string[] = []

  fields.forEach((field) => {
    // Skip disabled fields
    const isDisabled =
      'custom' in field &&
      typeof field.custom === 'object' &&
      field.custom?.['plugin-import-export']?.disabled === true

    if (isDisabled) {
      return
    }

    const name = 'name' in field && typeof field.name === 'string' ? field.name : undefined
    const fullKey = name && prefix ? `${prefix}_${name}` : (name ?? prefix)

    // Check if field is localized
    const isLocalized = 'localized' in field && field.localized === true

    // Helper to add keys with locale expansion if needed
    const addKey = (key: string, fieldIsLocalized: boolean) => {
      if (fieldIsLocalized && localeCodes && localeCodes.length > 0) {
        // Expand to locale-specific keys
        for (const locale of localeCodes) {
          keys.push(`${key}_${locale}`)
        }
      } else {
        keys.push(key)
      }
    }

    switch (field.type) {
      case 'array': {
        const subKeys = getFlattenedFieldKeys(
          field.fields as FlattenedField[],
          `${fullKey}_0`,
          options,
        )
        keys.push(...subKeys)
        break
      }
      case 'blocks': {
        field.blocks.forEach((block) => {
          if (typeof block === 'string') {
            return // Skip block references
          }
          const blockPrefix = `${fullKey}_0_${block.slug}`
          keys.push(`${blockPrefix}_blockType`)
          keys.push(`${blockPrefix}_id`)
          keys.push(
            ...getFlattenedFieldKeys(block.flattenedFields ?? block.fields, blockPrefix, options),
          )
        })
        break
      }
      case 'collapsible':
      case 'group':
      case 'row':
        keys.push(...getFlattenedFieldKeys(field.fields as FlattenedField[], fullKey, options))
        break
      case 'relationship':
      case 'upload':
        if (field.hasMany) {
          if (Array.isArray(field.relationTo)) {
            // hasMany polymorphic
            keys.push(`${fullKey}_0_relationTo`, `${fullKey}_0_id`)
          } else {
            // hasMany monomorphic
            keys.push(`${fullKey}_0`)
          }
        } else {
          if (Array.isArray(field.relationTo)) {
            // hasOne polymorphic
            keys.push(`${fullKey}_relationTo`, `${fullKey}_id`)
          } else {
            // hasOne monomorphic
            addKey(fullKey, isLocalized)
          }
        }
        break
      case 'tabs':
        field.tabs?.forEach((tab) => {
          const tabPrefix = tab.name ? `${fullKey}_${tab.name}` : fullKey
          keys.push(...getFlattenedFieldKeys(tab.fields || [], tabPrefix, options))
        })
        break
      default:
        if (!name) {
          break
        }
        if ('hasMany' in field && field.hasMany) {
          // Push placeholder for first index
          keys.push(`${fullKey}_0`)
        } else {
          addKey(fullKey, isLocalized)
        }
        break
    }
  })

  return keys
}
