import React from 'react'

import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { Field } from '../../../../../fields/config/types'

import { fieldAffectsData, fieldIsPresentationalOnly } from '../../../../../fields/config/types'

const formatFields = (config: SanitizedCollectionConfig): Field[] => {
  const hasID =
    config.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1
  const fields: Field[] = config.fields.reduce(
    (formatted, field) => {
      if (
        !fieldIsPresentationalOnly(field) &&
        (field.hidden === true || field?.admin?.disabled === true)
      ) {
        return formatted
      }

      return [...formatted, field]
    },
    hasID
      ? []
      : [
          {
            admin: {
              disableBulkEdit: true,
            },
            label: 'ID',
            name: 'id',
            type: 'text',
          },
        ],
  )

  return fields
}

export default formatFields
