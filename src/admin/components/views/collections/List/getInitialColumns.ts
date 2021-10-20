import { Field, fieldHasSubFields, fieldAffectsData } from '../../../../../fields/config/types';

const getInitialColumnState = (fields: Field[], useAsTitle: string, defaultColumns: string[]): string[] => {
  let initialColumns = [];

  if (Array.isArray(defaultColumns) && defaultColumns.length >= 1) {
    return defaultColumns;
  }


  if (useAsTitle) {
    initialColumns.push(useAsTitle);
  }

  const remainingColumns = fields.reduce((remaining, field) => {
    if (fieldAffectsData(field) && field.name === useAsTitle) {
      return remaining;
    }

    if (!fieldAffectsData(field) && fieldHasSubFields(field)) {
      return [
        ...remaining,
        ...field.fields.reduce((subFields, subField) => {
          if (fieldAffectsData(subField)) {
            return [
              ...subFields,
              subField.name,
            ];
          }

          return subFields;
        }, []),
      ];
    }

    return [
      ...remaining,
      field.name,
    ];
  }, []);

  initialColumns = initialColumns.concat(remainingColumns);
  initialColumns = initialColumns.slice(0, 4);

  return initialColumns;
};


export default getInitialColumnState;
