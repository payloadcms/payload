const formatListFields = (config) => {
  let listFields = config.fields.reduce((formatted, field) => {
    if (field.hidden === true || field?.hidden?.admin === true) {
      return formatted;
    }

    return [
      ...formatted,
      field,
    ];
  }, [{ name: 'id', label: 'ID', type: 'text' }]);

  if (config.timestamps) {
    listFields = listFields.concat([
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'date',
      }, {
        name: 'updatedAt',
        label: 'Updated At',
        type: 'date',
      },
    ]);
  }

  if (config.auth) {
    listFields = listFields.concat([
      {
        name: 'email',
        label: 'Email',
        type: 'email',
      }, {
        name: 'enableAPIKey',
        label: 'Enable API Key for this user',
        type: 'checkbox',
      },
    ]);
  }

  return listFields;
};

export default formatListFields;
