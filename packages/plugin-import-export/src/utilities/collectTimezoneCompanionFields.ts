import type { FlattenedField } from 'payload'

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
 * Collects the names of auto-generated timezone companion fields from the schema.
 *
 * When a date field has `timezone: true`, Payload automatically generates a companion
 * select field and inserts it immediately after the date field in the fields array.
 * This function identifies those auto-generated fields by looking at the field sequence
 * rather than assuming a specific naming convention (since the name can be overridden).
 *
 * This is used to filter out timezone companions unless explicitly selected,
 * without incorrectly filtering user-defined fields that happen to end with `_tz`.
 */
export const collectTimezoneCompanionFields = (
  fields: FieldWithPresentational[],
  prefix = '',
): Set<string> => {
  const result = new Set<string>()

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    if (!field) {
      continue
    }

    const name = 'name' in field && typeof field.name === 'string' ? field.name : undefined
    const fullKey = name && prefix ? `${prefix}_${name}` : (name ?? prefix)

    switch (field.type) {
      case 'array': {
        // Recurse into array fields - companion fields inside arrays get the array prefix
        const subFields = collectTimezoneCompanionFields(field.fields as FlattenedField[], fullKey)
        for (const subField of subFields) {
          result.add(subField)
        }
        break
      }

      case 'blocks': {
        // Recurse into each block type
        for (const block of field.blocks) {
          if (typeof block === 'string') {
            continue // Skip block references
          }
          const blockPrefix = `${fullKey}_${block.slug}`
          const blockFields = collectTimezoneCompanionFields(
            block.flattenedFields ?? block.fields,
            blockPrefix,
          )
          for (const blockField of blockFields) {
            result.add(blockField)
          }
        }
        break
      }

      case 'collapsible':
      case 'group':
      case 'row': {
        const subFields = collectTimezoneCompanionFields(field.fields as FlattenedField[], fullKey)
        for (const subField of subFields) {
          result.add(subField)
        }
        break
      }

      case 'date': {
        // If this date field has timezone enabled, the next field should be the companion
        // (Payload splices it in right after the date field during sanitization)
        if ('timezone' in field && field.timezone) {
          const nextField = fields[i + 1]
          if (nextField && 'name' in nextField && nextField.type === 'select') {
            const companionName = prefix ? `${prefix}_${nextField.name}` : nextField.name
            result.add(companionName)
          }
        }
        break
      }

      case 'tabs': {
        for (const tab of field.tabs ?? []) {
          let tabPrefix: string
          if (tab.name) {
            tabPrefix = fullKey ? `${fullKey}_${tab.name}` : tab.name
          } else {
            tabPrefix = fullKey
          }
          const tabFields = collectTimezoneCompanionFields(tab.fields || [], tabPrefix)
          for (const tabField of tabFields) {
            result.add(tabField)
          }
        }
        break
      }
    }
  }

  return result
}
