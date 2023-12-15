import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { Field } from '../../../../../fields/config/types'

import { fieldAffectsData, fieldIsPresentationalOnly } from '../../../../../fields/config/types'

const defaultIDField: Field = {
  name: 'id',
  admin: {
    disableBulkEdit: true,
  },
  label: 'ID',
  type: 'text',
}

const shouldSkipField = (field: Field): boolean =>
  !fieldIsPresentationalOnly(field) && (field.hidden === true || field.admin?.disabled === true)

const formatColumnFields = (config: SanitizedCollectionConfig): Field[] => {
  const hasID =
    config.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1

  const fields: Field[] = config.fields.reduce(
    (formatted, field) => {
      if (shouldSkipField(field)) {
        return formatted
      }

      const formattedField =
        field.type === 'tabs'
          ? {
              ...field,
              tabs: field.tabs.map((tab) => ({
                ...tab,
                fields: tab.fields.filter((tabField) => !shouldSkipField(tabField)),
              })),
            }
          : field

      return [...formatted, formattedField]
    },
    hasID ? [] : [defaultIDField],
  )

  return fields
}

export default formatColumnFields
