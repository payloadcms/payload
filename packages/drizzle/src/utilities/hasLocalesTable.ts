import type { Field } from 'payload'

import { fieldAffectsData, fieldHasSubFields } from 'payload/shared'

export const hasLocalesTable = ({
  fields,
  parentIsLocalized,
}: {
  fields: Field[]
  parentIsLocalized: boolean
}): boolean => {
  return fields.some((field) => {
    // arrays always get a separate table
    if (field.type === 'array') {
      return false
    }
    if (
      fieldAffectsData(field) &&
      field.localized &&
      (process.env.NEXT_PUBLIC_PAYLOAD_COMPATIBILITY_allowLocalizedWithinLocalized === 'true' ||
        !parentIsLocalized)
    ) {
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
