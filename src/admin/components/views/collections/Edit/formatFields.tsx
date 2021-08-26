import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field } from '../../../../../fields/config/types';

const formatFields = (collection: SanitizedCollectionConfig, isEditing: boolean): Field[] => (isEditing
  ? collection.fields.filter(({ name }) => name !== 'id')
  : collection.fields);

export default formatFields;
