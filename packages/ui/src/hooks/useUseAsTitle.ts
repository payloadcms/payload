'use client'
import type { ClientCollectionConfig, ClientField } from 'payload'

import { useTranslation } from '../providers/Translation/index.js'
import { flattenTopLevelFields } from 'payload/shared'

export const useUseTitleField = (collection: ClientCollectionConfig): ClientField => {
  const {
    admin: { useAsTitle },
    fields,
  } = collection
  const { i18n } = useTranslation()

  const topLevelFields = flattenTopLevelFields({ fields, i18n }) as ClientField[]

  return topLevelFields?.find((field) => 'name' in field && field.name === useAsTitle)
}
