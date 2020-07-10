const { ValidationError } = require('../errors');

module.exports = async (config, entityConfig, operation) => {
  const {
    data: fullData,
    originalDoc: fullOriginalDoc,
    operationName,
    hook,
    req,
  } = operation;

  // Maintain a top-level list of promises
  // so that all async field access / validations / hooks
  // can run in parallel
  const validationPromises = [];
  const accessPromises = [];
  const relationshipAccessPromises = [];
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

  const createRelationshipAccessPromise = async (data, field, access) => {
    const resultingData = data;

    const result = await access({ req });

    if (result === false) {
      delete resultingData[field.name];
    }
  };

  const createAccessPromise = async (data, originalDoc, field) => {
    const resultingData = data;

    if (field.access && field.access[operationName]) {
      const result = await field.access[operationName]({ req });

      if (!result && operationName === 'update' && originalDoc[field.name] !== undefined) {
        resultingData[field.name] = originalDoc[field.name];
      } else if (!result) {
        delete resultingData[field.name];
      }
    }

    if (field.type === 'relationship' && operationName === 'read') {
      const relatedCollections = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo];

      relatedCollections.forEach((slug) => {
        const collection = config.collections.find((coll) => coll.slug === slug);

        if (collection && collection.access && collection.access.read) {
          relationshipAccessPromises.push(createRelationshipAccessPromise(data, field, collection.access.read));
        }
      });
    }
  };

  const createHookPromise = async (data, field) => {
    const resultingData = data;

    if (field.hooks && field.hooks[hook]) {
      resultingData[field.name] = await field.hooks[hook](data[field.name]);
    }
  };

  const traverseFields = (fields, data = {}, originalDoc = {}, path) => {
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

      accessPromises.push(createAccessPromise(data, originalDoc, field));
      hookPromises.push(createHookPromise(data, field));

      if (field.fields) {
        if (field.name === undefined) {
          traverseFields(field.fields, data, originalDoc, path);
        } else if (field.type === 'array' || field.type === 'blocks') {
          if (Array.isArray(data[field.name])) {
            data[field.name].forEach((rowData, i) => {
              const originalDocRow = originalDoc && originalDoc[field.name] && originalDoc[field.name][i];
              traverseFields(field.fields, rowData, originalDocRow || undefined, `${path}${field.name}.${i}.`);
            });
          }
        } else {
          traverseFields(field.fields, data[field.name], originalDoc[field.name], `${path}${field.name}.`);
        }
      }

      if (operationName === 'create' || (operationName === 'update' && data[field.name] !== undefined)) {
        if (field.type === 'array' || field.type === 'blocks') {
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

  traverseFields(entityConfig.fields, fullData, fullOriginalDoc, '');
  await Promise.all(validationPromises);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  await Promise.all(accessPromises);
  await Promise.all(hookPromises);

  return fullData;
};
