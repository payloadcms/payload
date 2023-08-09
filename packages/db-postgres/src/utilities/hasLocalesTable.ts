import { fieldAffectsData, fieldHasSubFields } from 'payload/dist/fields/config/types';
import { Field } from 'payload/types';

export const hasLocalesTable = (fields: Field[]): boolean => {
  return fields.some((field) => {
    if (fieldAffectsData(field) && field.localized) return true;
    if (fieldHasSubFields(field) && field.type !== 'array') return hasLocalesTable(field.fields);
    if (field.type === 'tabs') return field.tabs.some((tab) => hasLocalesTable(tab.fields));
    return false;
  });
};
