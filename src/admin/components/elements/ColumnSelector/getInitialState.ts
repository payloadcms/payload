import { Field, fieldHasSubFields } from '../../../../fields/config/types';

const getInitialColumnState = (fields: Field[], useAsTitle: string, defaultColumns: string[]): { columns: string[] } => {
  let initialColumns = [];

  if (Array.isArray(defaultColumns) && defaultColumns.length >= 1) {
    return {
      columns: defaultColumns,
    };
  }


  if (useAsTitle) {
    initialColumns.push(useAsTitle);
  }

  const remainingColumns = fields.reduce((remaining, field) => {
    if (field.name === useAsTitle) {
      return remaining;
    }

    if (!field.name && fieldHasSubFields(field)) {
      return [
        ...remaining,
        ...field.fields.map((subField) => subField.name),
      ];
    }

    return [
      ...remaining,
      field.name,
    ];
  }, []);

  initialColumns = initialColumns.concat(remainingColumns);
  initialColumns = initialColumns.slice(0, 4);

  return {
    columns: initialColumns,
  };
};


export default getInitialColumnState;
