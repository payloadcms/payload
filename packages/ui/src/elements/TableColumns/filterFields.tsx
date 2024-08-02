'use client'

import type { ClientFieldConfig } from 'payload'

// 1. Skips fields that are hidden, disabled, or presentational-only (i.e. `ui` fields)
// 2. Maps through top-level `tabs` fields and filters out the same
export const filterFields = (incomingFields: ClientFieldConfig[]): ClientFieldConfig[] => {
  const shouldSkipField = (field: ClientFieldConfig): boolean =>
    (field.type !== 'ui' && field.disabled === true) || field?.disableListColumn === true

  const fields: ClientFieldConfig[] = incomingFields.reduce((formatted, field) => {
    if (shouldSkipField(field)) {
      return formatted
    }

    const formattedField: ClientFieldConfig =
      field.type === 'tabs' && 'tabs' in field.fieldComponentProps
        ? {
            ...field,
            fieldComponentProps: {
              ...field.fieldComponentProps,
              tabs: field.fieldComponentProps.tabs.map((tab) => ({
                ...tab,
                fieldMap: tab.fieldMap.filter((tabField) => !shouldSkipField(tabField)),
              })),
            },
          }
        : field

    return [...formatted, formattedField]
  }, [])

  return fields
}
