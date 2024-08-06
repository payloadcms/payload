import type { ClientCollectionConfig, ClientFieldConfig } from 'payload'

import { flattenFieldMap } from '../utilities/flattenFieldMap.js'

export const useUseTitleField = (
  collection: ClientCollectionConfig,
  fields: ClientFieldConfig[],
): ClientFieldConfig => {
  const {
    admin: { useAsTitle },
  } = collection

  const topLevelFields = flattenFieldMap(fields)
  return topLevelFields.find((field) => field.name === useAsTitle)
}
