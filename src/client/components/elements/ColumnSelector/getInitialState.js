const getInitialColumnState = (fields, useAsTitle, defaultColumns) => {
  let initialColumns = [];

  if (Array.isArray(defaultColumns)) {
    initialColumns = defaultColumns;
  } else if (useAsTitle) {
    initialColumns.push(useAsTitle);

    const remainingColumns = fields.filter((field) => {
      return field.name !== useAsTitle;
    }).slice(0, 2).map((field) => {
      return field.name;
    });
    initialColumns = initialColumns.concat(remainingColumns);
  } else {
    initialColumns = fields.slice(0, 3).reduce((columns, field) => {
      return [
        ...columns,
        field.name,
      ];
    }, []);
  }

  return {
    columns: initialColumns,
  };
};


module.exports = getInitialColumnState;
