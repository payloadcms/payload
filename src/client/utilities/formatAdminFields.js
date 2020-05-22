const formatAdminFields = (config) => {
  let formattedFields = config.fields.reduce((formatted, field) => {
    if (field.hidden === true || field?.hidden?.admin === true) {
      return formatted;
    }

    return [
      ...formatted,
      field,
    ];
  }, [{ name: 'id', label: 'ID' }]);

  if (config.timestamps) {
    formattedFields = formattedFields.concat([{ name: 'createdAt', label: 'Created At' }, { name: 'updatedAt', label: 'Updated At' }]);
  }

  return formattedFields;
};

export default formatAdminFields;
