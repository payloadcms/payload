import type { ClientField, Field } from 'payload'

import { fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared'

/**
 * Filters fields based on the following criteria:
 * 1. Skips fields that are hidden, disabled, or have `disableListColumn` set to `true`
 * 2. Lifts top-level `tabs` fields out and filters out the same
 */
export const filterFields = <T extends ClientField | Field>(incomingFields: T[]): T[] => {
  const shouldSkipField = (field: T): boolean =>
    (field.type !== 'ui' && fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) ||
    field?.admin?.disableListColumn === true

  const fields: T[] = incomingFields?.reduce((formatted, field) => {
    if (shouldSkipField(field)) {
      return formatted
    }

    // extract top-level `tabs` fields and filter out the same
    const formattedField: T =
      field.type === 'tabs' && 'tabs' in field
        ? {
            ...field,
            tabs: field.tabs.map((tab) => ({
              ...tab,
              fields: tab.fields.filter((tabField) => !shouldSkipField(tabField)),
            })),
          }
        : field

    return [...formatted, formattedField]
  }, [])

  return fields
}
