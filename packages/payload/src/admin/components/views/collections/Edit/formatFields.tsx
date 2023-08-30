import { SanitizedCollectionConfig } from '../../../../../collections/config/types.js';
import { Field, fieldAffectsData } from '../../../../../fields/config/types.js';

const formatFields = (collection: SanitizedCollectionConfig, isEditing: boolean): Field[] => (isEditing
  ? collection.fields.filter((field) => (fieldAffectsData(field) && field.name !== 'id') || true)
  : collection.fields);

export default formatFields;
