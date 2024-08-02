import type { ClientCollectionConfig, ClientFieldConfig } from 'payload'

import { flattenFieldMap } from '../utilities/flattenFieldMap.js'

export const useUseTitleField = (
  collection: ClientCollectionConfig,
  field: ClientFieldConfig,
): ClientFieldConfig => {
  const {
    admin: { useAsTitle },
  } = collection

  const topLevelFields = flattenFieldMap(field)
  return topLevelFields.find((field) => field.name === useAsTitle)
}
