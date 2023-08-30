import type { SanitizedCollectionConfig } from '../../../../../collections/config/types.js'
import type { Field } from '../../../../../fields/config/types.js'

import { fieldAffectsData } from '../../../../../fields/config/types.js'

const formatFields = (collection: SanitizedCollectionConfig, isEditing: boolean): Field[] =>
  isEditing
    ? collection.fields.filter((field) => (fieldAffectsData(field) && field.name !== 'id') || true)
    : collection.fields

export default formatFields
