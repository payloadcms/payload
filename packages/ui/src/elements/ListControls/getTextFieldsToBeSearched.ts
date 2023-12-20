import type { Field, FieldAffectingData } from 'payload/types'

import { fieldAffectsData } from 'payload/types'
import { flattenTopLevelFields } from 'payload/utilities'

export const getTextFieldsToBeSearched =
  (listSearchableFields: string[], fields: Field[]) => (): FieldAffectingData[] => {
    if (listSearchableFields) {
      const flattenedFields = flattenTopLevelFields(fields)
      return flattenedFields.filter(
        (field) => fieldAffectsData(field) && listSearchableFields.includes(field.name),
      ) as FieldAffectingData[]
    }

    return null
  }
