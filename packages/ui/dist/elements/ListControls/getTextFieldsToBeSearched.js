'use client';

import { fieldAffectsData, flattenTopLevelFields } from 'payload/shared';
export const getTextFieldsToBeSearched = (listSearchableFields, fields, i18n) => {
  if (listSearchableFields) {
    const flattenedFields = flattenTopLevelFields(fields, {
      i18n,
      moveSubFieldsToTop: true
    });
    const searchableFieldNames = new Set(listSearchableFields);
    const matchingFields = [];
    for (const field of flattenedFields) {
      if (fieldAffectsData(field) && searchableFieldNames.has(field.name)) {
        matchingFields.push(field);
        searchableFieldNames.delete(field.name);
      }
    }
    return matchingFields;
  }
  return null;
};
//# sourceMappingURL=getTextFieldsToBeSearched.js.map