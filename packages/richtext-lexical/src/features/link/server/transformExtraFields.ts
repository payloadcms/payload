import type { CollectionSlug, Field, FieldAffectingData, SanitizedConfig } from 'payload'

import { getBaseFields } from './baseFields.js'

/**
 * This function is run to enrich the basefields which every link has with potential, custom user-added fields.
 */
export function transformExtraFields(
  customFieldSchema:
    | ((args: {
        config: SanitizedConfig
        defaultFields: FieldAffectingData[]
      }) => (Field | FieldAffectingData)[])
    | Field[]
    | null,
  config: SanitizedConfig,
  enabledCollections?: CollectionSlug[],
  disabledCollections?: CollectionSlug[],
  maxDepth?: number,
): Field[] {
  const baseFields: FieldAffectingData[] = getBaseFields(
    config,
    enabledCollections,
    disabledCollections,
    maxDepth,
  )

  let fields: (Field | FieldAffectingData)[]

  if (typeof customFieldSchema === 'function') {
    fields = customFieldSchema({ config, defaultFields: baseFields })
  } else if (Array.isArray(customFieldSchema)) {
    fields = customFieldSchema
  } else {
    fields = baseFields
  }

  return fields as Field[]
}
