'use client'
import type { ClientCollectionConfig, ClientField } from 'payload'

import { useTranslation } from '../providers/Translation/index.js'
import { flattenFieldMap } from '../utilities/flattenFieldMap.js'

export const useUseTitleField = (
  collection: ClientCollectionConfig,
  fields: ClientField[],
): ClientField => {
  const {
    admin: { useAsTitle },
  } = collection
  const { i18n } = useTranslation()

  const topLevelFields = flattenFieldMap({ fields, i18n })
  return topLevelFields.find((field) => 'name' in field && field.name === useAsTitle)
}
