import type { i18n } from 'i18next'
import type { SanitizedConfig } from 'payload/config'
import type { Field } from 'payload/types'

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
): Field[] {
  const baseFields: Field[] = getBaseFields(config)

  const fields =
    typeof customFieldSchema === 'function'
      ? customFieldSchema({ config, defaultFields: baseFields, i18n })
      : baseFields

  // Wrap fields which are not part of the base schema in a group named 'fields' - otherwise they will be rendered but not saved
  const extraFields = []
  fields.forEach((field) => {
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
  })

  if (Array.isArray(customFieldSchema) || fields.length > 0) {
    fields.push({
      name: 'fields',
      admin: {
        style: {
          borderBottom: 0,
          borderTop: 0,
          margin: 0,
          padding: 0,
        },
      },
      fields: Array.isArray(customFieldSchema)
        ? customFieldSchema.concat(extraFields)
        : extraFields,
      type: 'group',
    })
  }
  return fields
}
