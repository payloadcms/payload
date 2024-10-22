import type { ClientField, Field } from 'payload'

import { fieldIsPresentationalOnly } from 'payload/shared'

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
export const flattenFieldMap = <T extends ClientField | Field>(
  fields: T[],
  keepPresentationalFields?: boolean,
): T[] => {
  return fields?.reduce((acc, field) => {
    if ('name' in field || (keepPresentationalFields && fieldIsPresentationalOnly(field))) {
      acc.push(field)
      return acc
    } else if ('fields' in field) {
      acc.push(...flattenFieldMap(field.fields as T[], keepPresentationalFields))
    } else if (field.type === 'tabs' && 'tabs' in field && Array.isArray(field.tabs)) {
      return [
        ...acc,
        ...field.tabs.reduce((tabAcc, tab) => {
          return [
            ...tabAcc,
            ...('name' in tab
              ? [{ ...tab }]
              : flattenFieldMap(tab.fields as T[], keepPresentationalFields)),
          ]
        }, []),
      ]
    }

    return acc
  }, [])
}
