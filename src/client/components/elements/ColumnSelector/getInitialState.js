const getInitialColumnState = ({
  fields, timestamps, useAsTitle, defaultColumns,
} = {}) => {
  let availableFields = [...fields].filter((field) => {
    return field?.hidden !== true && field?.hidden?.admin !== true;
  });

  availableFields.push({
    name: 'id',
    label: 'ID',
  });

  if (timestamps) {
    availableFields = availableFields.concat([
      {
        name: 'createdAt',
        label: 'Created At',
      },
      {
        name: 'modifiedAt',
        label: 'Modified At',
      },
    ]);
  }

  let initialColumns = [];

  if (Array.isArray(defaultColumns)) {
    initialColumns = defaultColumns;
  } else if (useAsTitle) {
    initialColumns.push(useAsTitle);

    const remainingColumns = availableFields.filter((field) => {
      return field.name !== useAsTitle;
    }).slice(0, 2).map((field) => {
      return field.name;
    });
    initialColumns = initialColumns.concat(remainingColumns);
  } else {
    initialColumns = availableFields.slice(0, 3).reduce((columns, field) => {
      return [
        ...columns,
        field.name,
      ];
    }, []);
  }

  return {
    columns: initialColumns,
    fields: availableFields,
  };
};


module.exports = getInitialColumnState;
