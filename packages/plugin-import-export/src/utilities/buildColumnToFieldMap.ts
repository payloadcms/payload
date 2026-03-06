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

/**
 * Walks the field tree with the same prefix logic as `getFlattenedFieldKeys`
 * and produces a map from CSV column key to the source field definition.
 *
 * Only schema-derivable keys are mapped (index 0 for arrays/blocks).
 * `toCSV`-derived columns and higher array indices will not appear in the map.
 */
export const buildColumnToFieldMap = (
  fields: FieldWithPresentational[],
  prefix = '',
): Map<string, FlattenedField> => {
  const map = new Map<string, FlattenedField>()

  fields.forEach((field) => {
    const isDisabled =
      'custom' in field &&
      typeof field.custom === 'object' &&
      field.custom?.['plugin-import-export']?.disabled === true

    if (isDisabled) {
      return
    }

    const name = 'name' in field && typeof field.name === 'string' ? field.name : undefined
    const fullKey = name && prefix ? `${prefix}_${name}` : (name ?? prefix)

    switch (field.type) {
      case 'array': {
        const subMap = buildColumnToFieldMap(field.fields as FlattenedField[], `${fullKey}_0`)
        for (const [k, v] of subMap) {
          map.set(k, v)
        }
        break
      }
      case 'blocks': {
        field.blocks.forEach((block) => {
          if (typeof block === 'string') {
            return
          }
          const blockPrefix = `${fullKey}_0_${block.slug}`
          const subMap = buildColumnToFieldMap(block.flattenedFields ?? block.fields, blockPrefix)
          for (const [k, v] of subMap) {
            map.set(k, v)
          }
        })
        break
      }
      case 'collapsible':
      case 'group':
      case 'row': {
        const subMap = buildColumnToFieldMap(field.fields as FlattenedField[], fullKey)
        for (const [k, v] of subMap) {
          map.set(k, v)
        }
        break
      }
      case 'tabs': {
        field.tabs?.forEach((tab) => {
          const tabPrefix = tab.name ? `${fullKey}_${tab.name}` : fullKey
          const subMap = buildColumnToFieldMap(tab.fields || [], tabPrefix)
          for (const [k, v] of subMap) {
            map.set(k, v)
          }
        })
        break
      }
      default: {
        if (!name) {
          break
        }
        if ('type' in field) {
          map.set(fullKey, field as FlattenedField)
        }
        break
      }
    }
  })

  return map
}
