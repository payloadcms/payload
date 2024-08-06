import type { ClientFieldConfig } from 'payload'

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
export const flattenFieldMap = (
  fields: ClientFieldConfig[],
  keepPresentationalFields?: boolean,
): ClientFieldConfig[] => {
  return fields.reduce((acc, field) => {
    if ('name' in field || (keepPresentationalFields && field._fieldIsPresentational)) {
      acc.push(field)
      return acc
    } else if ('fields' in field) {
      acc.push(...flattenFieldMap(field.fields, keepPresentationalFields))
    } else if (field.type === 'tabs' && 'tabs' in field && Array.isArray(field.tabs)) {
      return [
        ...acc,
        ...field.tabs.reduce((tabAcc, tab) => {
          return [
            ...tabAcc,
            ...('name' in tab
              ? [{ ...tab }]
              : flattenFieldMap(tab.fields, keepPresentationalFields)),
          ]
        }, []),
      ]
    }

    return acc
  }, [])
}
