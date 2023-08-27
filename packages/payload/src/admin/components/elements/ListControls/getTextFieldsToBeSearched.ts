import { Field, FieldAffectingData, fieldAffectsData } from '../../../../fields/config/types.js';
import flattenFields from '../../../../utilities/flattenTopLevelFields.js';

export const getTextFieldsToBeSearched = (listSearchableFields: string[], fields: Field[]) => (): FieldAffectingData[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenFields(fields);
    return flattenedFields.filter((field) => fieldAffectsData(field) && listSearchableFields.includes(field.name)) as FieldAffectingData[];
  }

  return null;
};
