import type { ClientField, Field } from 'payload'

import { fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared'

/**
 * Filters fields that are hidden, disabled, or have `disableListColumn` set to `true`
 * Does so recursively for `tabs` fields.
 */
export const filterFields = <T extends ClientField | Field>(incomingFields: T[]): T[] => {
  const shouldSkipField = (field: T): boolean =>
    (field.type !== 'ui' && fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) ||
    field?.admin?.disableListColumn === true

  const fields: T[] = incomingFields?.reduce((acc, field) => {
    if (shouldSkipField(field)) {
      return acc
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

    acc.push(formattedField)

    return acc
  }, [])

  return fields
}
