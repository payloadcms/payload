import type { i18n } from 'i18next'
import type { SanitizedConfig } from 'payload/config'
import type { Field, GroupField } from 'payload/types'

import { getBaseFields } from '../../drawer/baseFields'

/**
 * This function is run to enrich the basefields which every link has with potential, custom user-added fields.
 */
export function transformExtraFields(
  customFieldSchema:
    | ((args: { config: SanitizedConfig; defaultFields: Field[]; i18n: i18n }) => Field[])
    | Field[],
  config: SanitizedConfig,
  i18n: i18n,
  enabledCollections?: false | string[],
  disabledCollections?: false | string[],
  maxDepth?: number,
): Field[] {
  const baseFields: Field[] = getBaseFields(
    config,
    enabledCollections,
    disabledCollections,
    maxDepth,
  )

  const fields =
    typeof customFieldSchema === 'function'
      ? customFieldSchema({ config, defaultFields: baseFields, i18n })
      : baseFields

  // Wrap fields which are not part of the base schema in a group named 'fields' - otherwise they will be rendered but not saved
  const extraFields = []
  for (let i = fields.length - 1; i >= 0; i--) {
    const field = fields[i]

    if ('name' in field) {
      if (
        !baseFields.find((baseField) => !('name' in baseField) || baseField.name === field.name)
      ) {
        if (field.name !== 'fields' && field.type !== 'group') {
          extraFields.push(field)
          // Remove from fields from now, as they need to be part of the fields group below
          fields.splice(fields.indexOf(field), 1)
        }
      }
    }
  }

  if (Array.isArray(customFieldSchema) || fields.length > 0) {
    // find field with name 'fields' and add the extra fields to it
    const fieldsField: GroupField = fields.find(
      (field) => field.type === 'group' && field.name === 'fields',
    ) as GroupField
    if (!fieldsField) {
      throw new Error(
        'Could not find field with name "fields". This is required to add fields to the link field.',
      )
    }
    fieldsField.fields = Array.isArray(fieldsField.fields) ? fieldsField.fields : []
    fieldsField.fields.push(
      ...(Array.isArray(customFieldSchema) ? customFieldSchema.concat(extraFields) : extraFields),
    )
  }
  return fields
}
