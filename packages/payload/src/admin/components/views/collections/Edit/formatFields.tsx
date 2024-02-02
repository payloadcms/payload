import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { Field } from '../../../../../fields/config/types'

import { fieldAffectsData } from '../../../../../fields/config/types'

const formatFields = (collection: SanitizedCollectionConfig, isEditing?: boolean): Field[] =>
  isEditing
    ? collection.fields.filter((field) => !fieldAffectsData(field) || field.name !== 'id')
    : collection.fields

export default formatFields
