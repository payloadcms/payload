const formatFields = (config) => {
  let fields = [...config.fields];

  if (config.auth) {
    const authFields = [
      {
        type: 'auth',
        useAPIKey: config.auth.useAPIKey,
      },
    ];

    fields = authFields.concat(fields);
  }

  return fields;
};

export default formatFields;
