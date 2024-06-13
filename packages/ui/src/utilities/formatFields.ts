import type { Field } from 'payload'

import { fieldAffectsData } from 'payload/client'

export const formatFields = (fields: Field[], isEditing?: boolean): Field[] =>
  isEditing ? fields.filter((field) => !fieldAffectsData(field) || field.name !== 'id') : fields
