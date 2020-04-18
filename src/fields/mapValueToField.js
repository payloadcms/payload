const mapValueToField = (fields, data) => {
  return fields.reduce((mappedFieldValues, field) => {
    if (field.fields && data[field.name]) {
      return mapValueToField(field.fields, data[field.name]);
    }

    return [
      ...mappedFieldValues,
      {
        ...field,
        value: data[field.name],
      },
    ];
  }, []);
};

module.exports = mapValueToField;
