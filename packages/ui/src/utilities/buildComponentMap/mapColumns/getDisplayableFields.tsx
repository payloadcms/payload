import type { Field, FieldBase, RowLabel, SanitizedCollectionConfig } from 'payload/types'

import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/types'

// 2. Iterates all fields and returns only the fields that should be displayed in the admin interface
//   - If the field is presentational only, it should be skipped
//   - If the field is hidden or disabled, it should be skipped
//   - If the field is a tab, its fields should be checked
//   - Ensures that there is at least one field with the name 'id'

// TODO: type this more strongly
type DisplayableField = {
  name?: string
  admin?: {
    disableBulkEdit?: boolean
  }
  type?: string
  label?: FieldBase['label'] | RowLabel
  fields?: DisplayableField[]
  tabs?: DisplayableField[]
}

export const getDisplayableFields = (config: SanitizedCollectionConfig): DisplayableField[] => {
  const hasID =
    config.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1

  const defaultIDField: DisplayableField = {
    name: 'id',
    admin: {
      disableBulkEdit: true,
    },
    label: 'ID',
    type: 'text',
  }

  const shouldSkipField = (field: Field): boolean =>
    !fieldIsPresentationalOnly(field) && (field.hidden === true || field.admin?.disabled === true)

  const fields: DisplayableField[] = config.fields.reduce(
    (formatted, field) => {
      if (shouldSkipField(field)) {
        return formatted
      }

      const formattedField: DisplayableField = {
        name: ('name' in field && field.name) || undefined,
        type: field.type,
      }

      if (field.type === 'tabs') {
        formattedField.tabs = field.tabs.map((tab) => ({
          name: ('name' in tab && tab.name) || undefined,
          label: tab.label,
          fields: tab.fields.filter((tabField) => !shouldSkipField(tabField)),
        }))
      }

      return [...formatted, formattedField]
    },
    hasID ? [] : [defaultIDField],
  )

  return fields
}
