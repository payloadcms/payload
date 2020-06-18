const createPolicyPromise = async (args, data, field, operation) => {
  const resultingData = data;
  const result = await field.policies[operation](args);

  if (!result) {
    delete resultingData[field.name];
  }
};

const iterateFields = async (args, data, fields, operation, promises) => {
  fields.forEach((field) => {
    const dataToValidate = data || {};

    if (data[field.name] || field.name === undefined) {
      if (field.policies[operation]) {
        promises.push(createPolicyPromise(args, data, field, operation));
      } else if (field.fields) {
        if (field.name === undefined) {
          iterateFields(args, dataToValidate, field.fields, operation, promises);
        } else if (field.type === 'repeater' || field.type === 'flexible') {
          dataToValidate[field.name].forEach((rowData) => {
            iterateFields(args, rowData, field.fields, operation, promises);
          });
        } else {
          iterateFields(args, dataToValidate[field.name], field.fields, operation, promises);
        }
      }
    }
  });
};

module.exports = async (args, data, fields, operation) => {
  try {
    const promises = [];
    iterateFields(args, data, fields, operation, promises);
    await Promise.all(promises);
    return data;
  } catch (error) {
    throw error;
  }
};
