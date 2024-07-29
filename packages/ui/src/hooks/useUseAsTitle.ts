import type { ClientCollectionConfig, FieldMap, MappedField } from 'payload'

import { useTranslation } from '@payloadcms/ui'

import { flattenFieldMap } from '../utilities/flattenFieldMap.js'

export const useUseTitleField = (
  collection: ClientCollectionConfig,
  fieldMap: FieldMap,
): MappedField => {
  const {
    admin: { useAsTitle },
  } = collection
  const { i18n } = useTranslation()

  const topLevelFields = flattenFieldMap({ fieldMap, i18n })
  return topLevelFields.find((field) => field.name === useAsTitle)
}
