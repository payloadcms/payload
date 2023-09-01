import type { Field, FieldAffectingData } from '../../../../fields/config/types'

import { fieldAffectsData } from '../../../../fields/config/types'
import flattenFields from '../../../../utilities/flattenTopLevelFields'

export const getTextFieldsToBeSearched =
  (listSearchableFields: string[], fields: Field[]) => (): FieldAffectingData[] => {
    if (listSearchableFields) {
      const flattenedFields = flattenFields(fields)
      return flattenedFields.filter(
        (field) => fieldAffectsData(field) && listSearchableFields.includes(field.name),
      ) as FieldAffectingData[]
    }

    return null
  }
