import type { ClientCollectionConfig, FieldMap, MappedField } from 'payload'

import { flattenFieldMap } from '../utilities/flattenFieldMap.js'

export const useUseTitleField = (
  collection: ClientCollectionConfig,
  fieldMap: FieldMap,
): MappedField => {
  const {
    admin: { useAsTitle },
  } = collection

  const topLevelFields = flattenFieldMap(fieldMap)
  return topLevelFields.find((field) => field.name === useAsTitle)
}
