import type { SanitizedCollectionConfig } from 'payload/types'
import type { Field } from 'payload/types'

import { fieldAffectsData } from 'payload/types'

const formatFields = (collection: SanitizedCollectionConfig, isEditing?: boolean): Field[] =>
  isEditing
    ? collection.fields.filter((field) => (fieldAffectsData(field) && field.name !== 'id') || true)
    : collection.fields

export default formatFields
