import type { ClientField, Field } from 'payload'

import { fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared'

/**
 * Filters fields that are hidden, disabled, or have `disableListColumn` set to `true`.
 * Recurses through `tabs` and any container with `.fields` (e.g., `row`, `group`, `collapsible`).
 */
export const filterFields = <T extends ClientField | Field>(incomingFields: T[]): T[] => {
  const shouldSkipField = (field: T): boolean =>
    (field.type !== 'ui' && fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) ||
    field?.admin?.disableListColumn === true

  const recurse = (fields: T[] | undefined): T[] =>
    (fields ?? []).reduce<T[]>((acc, field) => {
      if (shouldSkipField(field)) {
        return acc
      }

      // handle tabs
      if (field.type === 'tabs' && 'tabs' in field) {
        const formattedField: T = {
          ...field,
          tabs: field.tabs.map((tab) => ({
            ...tab,
            fields: recurse(tab.fields as T[]),
          })),
        }
        acc.push(formattedField)
        return acc
      }

      // handle fields with sub fields (row, group, collapsible, etc.)
      if ('fields' in field && Array.isArray(field.fields)) {
        const formattedField: T = {
          ...field,
          fields: recurse(field.fields as T[]),
        }
        acc.push(formattedField)
        return acc
      }

      // leaf
      acc.push(field)
      return acc
    }, [])

  const fields: T[] = recurse(incomingFields)
  return fields
}
