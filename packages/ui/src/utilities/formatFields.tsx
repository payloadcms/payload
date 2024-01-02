import type { Field } from 'payload/types'

import { fieldAffectsData } from 'payload/types'

export const formatFields = (fields: Field[], isEditing?: boolean): Field[] =>
  isEditing
    ? fields.filter((field) => (fieldAffectsData(field) && field.name !== 'id') || true)
    : fields
