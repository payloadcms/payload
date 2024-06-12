import type { Field } from 'payload/bundle'

import { fieldAffectsData } from 'payload/bundle'

export const formatFields = (fields: Field[], isEditing?: boolean): Field[] =>
  isEditing ? fields.filter((field) => !fieldAffectsData(field) || field.name !== 'id') : fields
