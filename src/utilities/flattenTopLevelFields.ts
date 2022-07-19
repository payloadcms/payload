import { Field, FieldAffectingData, fieldAffectsData, fieldHasSubFields, fieldIsPresentationalOnly, FieldPresentationalOnly } from '../fields/config/types';

const flattenFields = (fields: Field[], keepPresentationalFields?: boolean): (FieldAffectingData | FieldPresentationalOnly)[] => {
  return fields.reduce((fieldsToUse, field) => {
    if (fieldAffectsData(field) || (keepPresentationalFields && fieldIsPresentationalOnly(field))) {
      return [
        ...fieldsToUse,
        field,
      ];
    }

    if (fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...flattenFields(field.fields, keepPresentationalFields),
      ];
    }

    if (field.type === 'tabs') {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          return [
            ...tabFields,
            ...flattenFields(tab.fields, keepPresentationalFields),
          ];
        }, []),
      ];
    }

    return fieldsToUse;
  }, []);
};

export default flattenFields;
