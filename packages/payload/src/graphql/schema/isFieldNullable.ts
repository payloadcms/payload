import type { FieldAffectingData } from '../../fields/config/types'

import { fieldAffectsData } from '../../fields/config/types'

const isFieldNullable = (field: FieldAffectingData, force: boolean): boolean => {
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

export default isFieldNullable
