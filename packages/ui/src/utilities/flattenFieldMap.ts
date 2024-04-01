import type { FieldMap } from '../providers/ComponentMap/buildComponentMap/types.js'

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
export const flattenFieldMap = (
  fieldMap: FieldMap,
  keepPresentationalFields?: boolean,
): FieldMap => {
  return fieldMap.reduce((fieldsToUse, field) => {
    if ('name' in field || (keepPresentationalFields && field.type === 'ui')) {
      fieldsToUse.push(field)
      return fieldsToUse
    } else if (
      // has subfields
      'fieldMap' in field.fieldComponentProps
    ) {
      fieldsToUse.push(
        ...flattenFieldMap(field.fieldComponentProps.fieldMap, keepPresentationalFields),
      )
    }

    if (field.type === 'tabs' && 'tabs' in field && Array.isArray(field.tabs)) {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce(
          (
            tabFields,
            tab: {
              fieldMap?: FieldMap
              label: string
              name?: string
            },
          ) => {
            return [
              ...tabFields,
              ...('name' in tab
                ? [{ ...tab, type: 'tab' }]
                : flattenFieldMap(tab.fieldMap, keepPresentationalFields)),
            ]
          },
          [],
        ),
      ]
    }

    return fieldsToUse
  }, [])
}
