const flattenTopLevelFields = (fields) => fields.reduce((flattened, field) => {
  if (!field.name && Array.isArray(field.fields)) {
    return [
      ...flattened,
      ...field.fields.filter((subField) => subField.name),
    ];
  }

  return [
    ...flattened,
    field,
  ];
}, []);

export default flattenTopLevelFields;
