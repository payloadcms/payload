import type { FieldAffectingData, SanitizedCollectionConfig } from '../../exports/types'

import { fieldAffectsData } from '../../exports/types'
import flattenFields from '../../utilities/flattenTopLevelFields'

export const useUseTitleField = (collection: SanitizedCollectionConfig): FieldAffectingData => {
  const {
    admin: { useAsTitle },
    fields,
  } = collection

  const topLevelFields = flattenFields(fields)
  return topLevelFields.find(
    (field) => fieldAffectsData(field) && field.name === useAsTitle,
  ) as FieldAffectingData
}
