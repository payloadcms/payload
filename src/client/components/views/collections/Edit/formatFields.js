const formatFields = (config, isEditing) => {
  let fields = [...config.fields];

  if (config.auth) {
    const authFields = [
      {
        type: 'auth',
        useAPIKey: config.auth.useAPIKey,
        requirePassword: !isEditing,
      },
    ];

    fields = authFields.concat(fields);
  }

  if (config.upload) {
    const uploadFields = [
      {
        type: 'file',
        ...config.upload,
      },
    ];

    fields = uploadFields.concat(fields);
  }

  return fields;
};

export default formatFields;
