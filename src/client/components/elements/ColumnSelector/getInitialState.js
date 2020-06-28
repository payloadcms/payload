const getInitialColumnState = (fields, useAsTitle, defaultColumns) => {
  let initialColumns = [];

  const hasThumbnail = fields.find(field => field.type === 'thumbnail');

  if (Array.isArray(defaultColumns)) {
    initialColumns = defaultColumns;
  }

  if (hasThumbnail) {
    initialColumns.push('thumbnail');
  }

  if (useAsTitle) {
    initialColumns.push(useAsTitle);
  }

  const remainingColumns = fields.filter((field) => {
    return field.name !== useAsTitle && field.type !== 'thumbnail';
  }).slice(0, 3 - initialColumns.length).map((field) => {
    return field.name;
  });

  initialColumns = initialColumns.concat(remainingColumns);

  return {
    columns: initialColumns,
  };
};


module.exports = getInitialColumnState;
