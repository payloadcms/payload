import type { Field } from 'payload'

import { fieldAffectsData, fieldHasSubFields, fieldShouldBeLocalized } from 'payload/shared'

export const hasLocalesTable = ({
  fields,
  parentIsLocalized,
}: {
  fields: Field[]
  /**
   * @todo make required in v4.0. Usually you'd wanna pass this in
   */
  parentIsLocalized?: boolean
}): boolean => {
  return fields.some((field) => {
    // arrays always get a separate table
    if (field.type === 'array') {
      return false
    }
    if (fieldAffectsData(field) && fieldShouldBeLocalized({ field, parentIsLocalized })) {
      return true
    }
    if (fieldHasSubFields(field)) {
      return hasLocalesTable({
        fields: field.fields,
        parentIsLocalized: parentIsLocalized || ('localized' in field && field.localized),
      })
    }
    if (field.type === 'tabs') {
      return field.tabs.some((tab) =>
        hasLocalesTable({
          fields: tab.fields,
          parentIsLocalized: parentIsLocalized || tab.localized,
        }),
      )
    }
    return false
  })
}
