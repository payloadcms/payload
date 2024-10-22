import type { ClientField, Field } from 'payload'

// 1. Skips fields that are hidden, disabled, or presentational-only (i.e. `ui` fields)
// 2. Maps through top-level `tabs` fields and filters out the same
export const filterFields = <T extends ClientField | Field>(incomingFields: T[]): T[] => {
  const shouldSkipField = (field: T): boolean =>
    (field.type !== 'ui' && field.admin?.disabled === true) ||
    field?.admin?.disableListColumn === true

  const fields: T[] = incomingFields?.reduce((formatted, field) => {
    if (shouldSkipField(field)) {
      return formatted
    }

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
