const { ValidationError } = require('../errors');

module.exports = async (config, operation) => {
  const {
    data: fullData,
    operationName,
    hook,
  } = operation;

  // Maintain a top-level list of promises
  // so that all async field policies / validations / hooks
  // can run in tandem
  const validationPromises = [];
  const policyPromises = [];
  const hookPromises = [];
  const errors = [];

  const createValidationPromise = async (data, field, path) => {
    const shouldValidate = field.validate && !field.condition;
    const dataToValidate = data || field.defaultValue;
    const result = shouldValidate ? await field.validate(dataToValidate, field) : true;

    if (!result || typeof result === 'string') {
      errors.push({
        message: result,
        field: `${path}${field.name}`,
      });
    }
  };

  const createPolicyPromise = async (data, field) => {
    const resultingData = data;

    if (field.policies && field.policies[operationName]) {
      const result = await field.policies[operationName](operation);

      if (!result) {
        delete resultingData[field.name];
      }
    }
  };

  const createHookPromise = async (data, field) => {
    const resultingData = data;

    if (field.hooks && field.hooks[hook]) {
      resultingData[field.name] = await field.hooks[hook](data[field.name]);
    }
  };

  const traverseFields = (fields, data = {}, path) => {
    fields.forEach((field) => {
      const dataCopy = data;

      if (field.type === 'upload') {
        if (data[field.name] === '') dataCopy[field.name] = null;
      }

      // TODO: sanitize additional field types as necessary i.e. relationships

      if (field.type === 'checkbox') {
        if (data[field.name] === 'true') dataCopy[field.name] = true;
        if (data[field.name] === 'false') dataCopy[field.name] = false;
      }

      policyPromises.push(createPolicyPromise(data, field));
      hookPromises.push(createHookPromise(data, field));

      if (field.fields) {
        if (field.name === undefined) {
          traverseFields(field.fields, data, path);
        } else if (field.type === 'repeater' || field.type === 'flexible') {
          if (Array.isArray(data[field.name])) {
            data[field.name].forEach((rowData, i) => {
              traverseFields(field.fields, rowData, `${path}${field.name}.${i}.`);
            });
          }
        } else {
          traverseFields(field.fields, data[field.name], `${path}${field.name}.`);
        }
      }

      if (operationName === 'create' || (operationName === 'update' && data[field.name] !== undefined)) {
        if (field.type === 'repeater' || field.type === 'flexible') {
          const hasRowsOfData = Array.isArray(data[field.name]);
          const rowCount = hasRowsOfData ? data[field.name].length : 0;

          validationPromises.push(createValidationPromise(rowCount, field, path));
        } else {
          validationPromises.push(createValidationPromise(data[field.name], field, path));
        }
      }
    });
  };

  // //////////////////////////////////////////
  // Entry point for field validation
  // //////////////////////////////////////////

  try {
    traverseFields(config.fields, fullData, '');
    await Promise.all(validationPromises);

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    await Promise.all(policyPromises);
    await Promise.all(hookPromises);

    return fullData;
  } catch (error) {
    throw error;
  }
};
