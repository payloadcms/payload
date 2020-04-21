const { ValidationError } = require('../errors');

const validateUpdate = async (data, fields) => {
  const validationPromises = [];
  const validatedFields = [];

  Object.keys(data).forEach((key) => {
    const dataToValidate = data[key];

    const field = fields.find(matchedField => matchedField.name === key);

    if (field && dataToValidate) {
      validationPromises.push(field.validate(dataToValidate, field));
      validatedFields.push(field);
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
          field: field.name,
          message: result,
        },
      ];
    }

    return results;
  }, []);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

module.exports = validateUpdate;
