'use client'
import type { ClientCollectionConfig, ClientField } from 'payload'

import { flattenFields } from 'payload/shared'

export const useUseTitleField = (collection: ClientCollectionConfig): ClientField => {
  const {
    admin: { useAsTitle },
    fields,
  } = collection

  const topLevelFields = flattenFields(fields) as ClientField[]

  return topLevelFields?.find((field) => 'name' in field && field.name === useAsTitle)
}
