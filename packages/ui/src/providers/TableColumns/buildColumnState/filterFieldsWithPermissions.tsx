import type {
  ClientField,
  Field,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
} from 'payload'

import { fieldAffectsData, fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared'

export const filterFieldsWithPermissions = <T extends ClientField | Field>({
  fieldPermissions,
  fields,
}: {
  fieldPermissions?: SanitizedFieldPermissions | SanitizedFieldsPermissions
  fields: T[]
}): T[] => {
  const shouldSkipField = (field: T): boolean =>
    (field.type !== 'ui' && fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) ||
    field?.admin?.disableListColumn === true

  return (fields ?? []).reduce<T[]>((acc, field) => {
    if (shouldSkipField(field)) {
      return acc
    }

    // handle tabs
    if (field.type === 'tabs' && 'tabs' in field) {
      const formattedField: T = {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: filterFieldsWithPermissions({
            fieldPermissions:
              typeof fieldPermissions === 'boolean'
                ? fieldPermissions
                : 'name' in tab && tab.name
                  ? fieldPermissions[tab.name]?.fields || fieldPermissions[tab.name]
                  : fieldPermissions,
            fields: tab.fields,
          }),
        })),
      }
      acc.push(formattedField)
      return acc
    }

    // handle fields with subfields (row, group, collapsible, etc.)
    if ('fields' in field && Array.isArray(field.fields)) {
      const formattedField: T = {
        ...field,
        fields: filterFieldsWithPermissions({
          fieldPermissions:
            typeof fieldPermissions === 'boolean'
              ? fieldPermissions
              : 'name' in field && field.name
                ? fieldPermissions[field.name]?.fields || fieldPermissions[field.name]
                : fieldPermissions,
          fields: field.fields as T[],
        }),
      }
      acc.push(formattedField)
      return acc
    }

    if (fieldPermissions === true) {
      acc.push(field)
      return acc
    }

    if (fieldAffectsData(field)) {
      if (fieldPermissions[field.name] === true || fieldPermissions[field.name]?.read) {
        acc.push(field)
      }
      return acc
    }

    // leaf
    acc.push(field)
    return acc
  }, [])
}
