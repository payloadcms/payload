import type { FieldMap } from 'payload'

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
  return fieldMap.reduce((acc, field) => {
    if ('name' in field || (keepPresentationalFields && field.fieldIsPresentational)) {
      acc.push(field)
      return acc
    } else if ('fieldMap' in field.fieldComponentProps) {
      acc.push(...flattenFieldMap(field.fieldComponentProps.fieldMap, keepPresentationalFields))
    } else if (
      field.type === 'tabs' &&
      'tabs' in field.fieldComponentProps &&
      Array.isArray(field.fieldComponentProps.tabs)
    ) {
      return [
        ...acc,
        ...field.fieldComponentProps.tabs.reduce((tabAcc, tab) => {
          return [
            ...tabAcc,
            ...('name' in tab
              ? [{ ...tab }]
              : flattenFieldMap(tab.fieldMap, keepPresentationalFields)),
          ]
        }, []),
      ]
    }

    return acc
  }, [])
}
