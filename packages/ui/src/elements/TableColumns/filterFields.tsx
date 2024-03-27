import type { FieldMap, MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'

// 1. Skips fields that are hidden, disabled, or presentational-only (i.e. `ui` fields)
// 2. Maps through top-level `tabs` fields and filters out the same
export const filterFields = (fieldMap: FieldMap): FieldMap => {
  const shouldSkipField = (field: MappedField): boolean =>
    field.type !== 'ui' && (field.isHidden === true || field.disabled === true)

  const fields: FieldMap = fieldMap.reduce((formatted, field) => {
    if (shouldSkipField(field)) {
      return formatted
    }

    const formattedField: MappedField =
      field.type === 'tabs' && 'tabs' in field.fieldComponentProps
        ? {
            ...field,
            fieldComponentProps: {
              ...field.fieldComponentProps,
              tabs: field.fieldComponentProps.tabs.map((tab) => ({
                ...tab,
                fields: tab.fieldMap.filter((tabField) => !shouldSkipField(tabField)),
              })),
            },
          }
        : field

    return [...formatted, formattedField]
  }, [])

  return fields
}
