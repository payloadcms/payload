import type { Field, FieldAffectingData, SanitizedConfig } from 'payload'

import { getBaseFields } from '../../drawer/baseFields.js'

/**
 * This function is run to enrich the basefields which every link has with potential, custom user-added fields.
 */
export function transformExtraFields(
  customFieldSchema:
    | ((args: { config: SanitizedConfig; defaultFields: FieldAffectingData[] }) => Field[])
    | Field[],
  config: SanitizedConfig,
  enabledCollections?: false | string[],
  disabledCollections?: false | string[],
  maxDepth?: number,
): Field[] {
  const baseFields: FieldAffectingData[] = getBaseFields(
    config,
    enabledCollections,
    disabledCollections,
    maxDepth,
  )

  let fields: Field[]

  if (typeof customFieldSchema === 'function') {
    fields = customFieldSchema({ config, defaultFields: baseFields })
  } else if (Array.isArray(customFieldSchema)) {
    fields = customFieldSchema
  } else {
    fields = baseFields as Field[]
  }

  return fields
}
