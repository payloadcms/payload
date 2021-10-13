import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field, fieldIsNamed } from '../../../../../fields/config/types';

const formatFields = (collection: SanitizedCollectionConfig, isEditing: boolean): Field[] => (isEditing
  ? collection.fields.filter((field) => fieldIsNamed(field) && field.name !== 'id')
  : collection.fields);

export default formatFields;
