import {
  Field,
  FieldAffectingData,
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsPresentationalOnly,
  FieldPresentationalOnly,
  tabHasName,
} from '../fields/config/types';

const flattenFields = (fields: Field[], keepPresentationalFields?: boolean): (FieldAffectingData | FieldPresentationalOnly)[] => {
  return fields.reduce((fieldsToUse, field) => {
    if (fieldHasSubFields(field)) {
      const subfields = field.fields.map((subfield) => {
        const name = [(<any>field).name, (<any>subfield).name].join('.');

        return {
          ...subfield,
          name,
        };
      });

      return [
        ...fieldsToUse,
        ...flattenFields(subfields, keepPresentationalFields),
      ];
    }

    if (field.type === 'tabs') {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          return [
            ...tabFields,
            ...(tabHasName(tab) ? [{ ...tab, type: 'tab' }] : flattenFields(tab.fields, keepPresentationalFields)),
          ];
        }, []),
      ];
    }

    if (fieldAffectsData(field) || (keepPresentationalFields && fieldIsPresentationalOnly(field))) {
      return [
        ...fieldsToUse,
        field,
      ];
    }

    return fieldsToUse;
  }, []);
};

export default flattenFields;
