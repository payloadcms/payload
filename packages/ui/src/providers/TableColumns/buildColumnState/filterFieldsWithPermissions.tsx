import type {
  ClientField,
  Field,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
} from 'payload'

import { fieldAffectsData, fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared'

const shouldSkipField = (field: ClientField | Field): boolean =>
  (field.type !== 'ui' && fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) ||
  field?.admin?.disableListColumn === true

export const filterFieldsWithPermissions = <T extends ClientField | Field = ClientField>({
  fieldPermissions,
  fields,
}: {
  fieldPermissions?: SanitizedFieldPermissions | SanitizedFieldsPermissions
  fields: (ClientField | Field)[]
}): T[] => {
  return (fields ?? []).reduce((acc, field) => {
    if (shouldSkipField(field)) {
      return acc
    }

    // handle tabs
    if (field.type === 'tabs' && 'tabs' in field) {
      const formattedField = {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: filterFieldsWithPermissions<T>({
            fieldPermissions:
              typeof fieldPermissions === 'boolean'
                ? fieldPermissions
                : 'name' in tab && tab.name
                  ? fieldPermissions[tab.name]?.fields || fieldPermissions[tab.name]
                  : fieldPermissions,
            fields: tab.fields,
          }),
        })),
      } as ClientField | Field
      acc.push(formattedField)
      return acc
    }

    // handle fields with subfields (row, group, collapsible, etc.)
    if ('fields' in field && Array.isArray(field.fields)) {
      const formattedField = {
        ...field,
        fields: filterFieldsWithPermissions<T>({
          fieldPermissions:
            typeof fieldPermissions === 'boolean'
              ? fieldPermissions
              : 'name' in field && field.name
                ? fieldPermissions?.[field.name]?.fields || fieldPermissions?.[field.name]
                : fieldPermissions,
          fields: field.fields,
        }),
      } as ClientField | Field
      acc.push(formattedField)
      return acc
    }

    if (fieldPermissions === true) {
      acc.push(field)
      return acc
    }

    if (fieldAffectsData(field)) {
      const fieldPermission = fieldPermissions?.[field.name]
      // Always allow ID fields, or if explicitly granted (true or { read: true })
      // undefined means field is not in permissions object = denied
      if (fieldIsID(field) || fieldPermission === true || fieldPermission?.read === true) {
        acc.push(field)
      }
      return acc
    }

    // leaf
    acc.push(field)
    return acc
  }, [])
}
