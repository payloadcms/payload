const { ValidationError } = require('../errors');

const createValidationPromise = async (data, field) => {
  const result = await field.validate(data, field);
  return { result, field };
};

exports.iterateFields = async (data, fields, path = '') => {
  const validationPromises = [];

  fields.forEach((field) => {
    const dataToValidate = data || {};

    if ((field.required && !field.localized && !field.condition)) {
      // If this field does not have a name, it is for
      // admin panel composition only and should not be
      // validated against directly
      if (field.name === undefined && field.fields) {
        field.fields.forEach((subField) => {
          validationPromises.push(createValidationPromise(dataToValidate[subField.name], subField));
        });
      } else if (field.fields) {
        if (field.type === 'repeater' || field.type === 'flexible') {
          const rowCount = Array.isArray(dataToValidate[field.name]) ? dataToValidate[field.name].length : 0;
          validationPromises.push(createValidationPromise(rowCount, field));

          if (Array.isArray(dataToValidate[field.name])) {
            dataToValidate[field.name].forEach((rowData, i) => {
              validationPromises.push(exports.iterateFields(rowData, field.fields, `${path}${field.name}.${i}.`));
            });
          }
        } else {
          validationPromises.push(exports.iterateFields(dataToValidate[field.name], field.fields, `${path}${field.name}`));
        }
      } else {
        validationPromises.push(createValidationPromise(dataToValidate[field.name], field));
      }
    }
  });

  const validationResults = await Promise.all(validationPromises);

  const errors = validationResults.reduce((results, result) => {
    const { field, result: validationResult } = result;

    if (Array.isArray(result)) {
      return [
        ...results,
        ...result,
      ];
    }

    if (validationResult === false || typeof validationResult === 'string') {
      const fieldPath = `${path}${field.name}`;

      return [
        ...results,
        {
          field: fieldPath,
          message: validationResult,
        },
      ];
    }

    return results;
  }, []);

  return errors;
};

exports.validateCreate = async (data, fields) => {
  try {
    const errors = await exports.iterateFields(data, fields);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  } catch (error) {
    throw error;
  }
};
