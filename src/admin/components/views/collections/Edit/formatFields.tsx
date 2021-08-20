const formatFields = (collection, isEditing) => {
  const fields = isEditing
    ? collection.fields.filter(({ name }) => name !== 'id')
    : collection.fields;
  return fields;
};

export default formatFields;
