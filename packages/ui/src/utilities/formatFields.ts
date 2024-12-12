import type { Field } from 'payload'

import { fieldAffectsData, fieldIsID } from 'payload/shared'

export const formatFields = (fields: Field[], isEditing?: boolean): Field[] =>
  isEditing ? fields.filter((field) => !fieldAffectsData(field) || !fieldIsID(field)) : fields
