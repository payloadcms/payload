const { ValidationError } = require('../errors');

exports.iterateFields = async (data, fields, path = '') => {
  const validationPromises = [];
  const validatedFields = [];

  fields.forEach((field) => {
    const requiresAtLeastOneSubfield = field.fields && field.fields.some(subField => (subField.required && !subField.localized));

    if (field.required || requiresAtLeastOneSubfield) {
      if (data && data[field.name] !== null) {
        validationPromises.push(field.validate(data[field.name], field));
        validatedFields.push(field);
      } else {
        validationPromises.push({
          field: `${path}${field.name}`,
          message: `${path}${field.name} is required.`,
        });
      }
    }
  });

  const validationResults = await Promise.all(validationPromises);

  const errors = validationResults.reduce((results, result, i) => {
    const field = validatedFields[i];
    if (Array.isArray(result)) {
      return [
        ...results,
        ...result,
      ];
    } if (result !== true) {
      return [
        ...results,
        {
          field: `${path}${field.name}`,
          message: result,
        },
      ];
    }

    return results;
  }, []);

  return errors;
};

exports.validateCreate = async (data, fields) => {
  const errors = await exports.iterateFields(data, fields);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};
