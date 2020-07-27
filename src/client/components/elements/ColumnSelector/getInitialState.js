const getInitialColumnState = (fields, useAsTitle, defaultColumns) => {
  let initialColumns = [];

  const hasThumbnail = fields.find((field) => field.type === 'thumbnail');

  if (Array.isArray(defaultColumns) && defaultColumns.length >= 1) {
    return {
      columns: defaultColumns,
    };
  }

  if (hasThumbnail) {
    initialColumns.push('thumbnail');
  }

  if (useAsTitle) {
    initialColumns.push(useAsTitle);
  }

  const remainingColumns = fields.filter((field) => field.name !== useAsTitle && field.type !== 'thumbnail')
    .slice(0, 3 - initialColumns.length).map((field) => field.name);

  initialColumns = initialColumns.concat(remainingColumns);

  return {
    columns: initialColumns,
  };
};


module.exports = getInitialColumnState;
