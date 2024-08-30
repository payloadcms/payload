import type { FieldAffectingData } from 'payload'

import { fieldAffectsData } from 'payload/shared'

export const isFieldNullable = (field: FieldAffectingData, force: boolean): boolean => {
  const hasReadAccessControl = field.access && field.access.read
  const condition = field.admin && field.admin.condition
  return !(
    force &&
    fieldAffectsData(field) &&
    'required' in field &&
    field.required &&
    !field.localized &&
    !condition &&
    !hasReadAccessControl
  )
}
