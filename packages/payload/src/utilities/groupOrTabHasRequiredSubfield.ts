import { Field, fieldAffectsData, Tab } from '../fields/config/types';

export const groupOrTabHasRequiredSubfield = (entity: Field | Tab): boolean => {
  if ('type' in entity && entity.type === 'group') {
    return entity.fields.some((subField) => {
      return (fieldAffectsData(subField) && 'required' in subField && subField.required) || groupOrTabHasRequiredSubfield(subField);
    });
  }

  if ('fields' in entity && 'name' in entity) {
    return (entity as Tab).fields.some((subField) => groupOrTabHasRequiredSubfield(subField));
  }

  return false;
};
