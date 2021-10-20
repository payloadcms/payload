import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field, fieldAffectsData } from '../../../../../fields/config/types';

const formatFields = (collection: SanitizedCollectionConfig, isEditing: boolean): Field[] => (isEditing
  ? collection.fields.filter((field) => (fieldAffectsData(field) && field.name !== 'id') || true)
  : collection.fields);

export default formatFields;
