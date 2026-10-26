import type { Field, Tab } from 'payload'

import { fieldAffectsData, fieldIsVirtual } from 'payload/shared'

const fieldIsRequiredInMutation = (field: Field, parentIsLocalized: boolean): boolean => {
  if (!fieldAffectsData(field)) {
    return false
  }

  if (field.hidden) {
    return false
  }

  if (!('required' in field) || !field.required) {
    return false
  }

  const hasReadAccessControl = Boolean(field.access && field.access.read)
  const condition = Boolean(field.admin && field.admin.condition)
  const isTimestamp = field.name === 'createdAt' || field.name === 'updatedAt'
  const isVirtual = fieldIsVirtual(field)

  if (
    condition ||
    hasReadAccessControl ||
    isTimestamp ||
    isVirtual ||
    (field.localized && !parentIsLocalized)
  ) {
    return false
  }

  return true
}

export const groupOrTabHasRequiredSubfield = (
  entity: Field | Tab,
  parentIsLocalized: boolean = false,
): boolean => {
  if ('hidden' in entity && entity.hidden) {
    return false
  }

  const localized = parentIsLocalized || Boolean('localized' in entity && entity.localized)

  if ('fields' in entity && Array.isArray(entity.fields)) {
    return entity.fields.some((subField) => {
      if ('hidden' in subField && subField.hidden) {
        return false
      }

      // Stop requiredness propagation at an optional array boundary.
      // An optional array containing required fields must not make the enclosing container required.
      if (subField.type === 'array') {
        if (!fieldIsRequiredInMutation(subField, localized)) {
          return false
        }
        return groupOrTabHasRequiredSubfield(subField, localized)
      }

      // Check direct required fields
      if (fieldIsRequiredInMutation(subField, localized)) {
        return true
      }

      // Check nested groups
      if (subField.type === 'group') {
        const hasCondition = Boolean(subField.admin && subField.admin.condition)
        const hasReadAccess = Boolean(subField.access && subField.access.read)
        if (hasCondition || hasReadAccess) {
          return false
        }
        return groupOrTabHasRequiredSubfield(subField, localized || Boolean(subField.localized))
      }

      // Check layout containers (row, collapsible)
      if (subField.type === 'row' || subField.type === 'collapsible') {
        return groupOrTabHasRequiredSubfield(subField, localized)
      }

      // Check tabs inside tabs field
      if (subField.type === 'tabs') {
        return subField.tabs.some((tab) => {
          if (tab.hidden) {
            return false
          }
          return groupOrTabHasRequiredSubfield(tab, localized || Boolean(tab.localized))
        })
      }

      return false
    })
  }

  return false
}
