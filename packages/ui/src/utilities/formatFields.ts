import type { Field } from '@ruya.sa/payload'

import { fieldAffectsData, fieldIsID } from '@ruya.sa/payload/shared'

export const formatFields = (fields: Field[], isEditing?: boolean): Field[] =>
  isEditing ? fields.filter((field) => !fieldAffectsData(field) || !fieldIsID(field)) : fields
