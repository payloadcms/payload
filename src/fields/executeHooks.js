const executeFieldHooks = async (operation, fields, value, hookName, data = null) => {
  const fullData = value || data;
  if (Array.isArray(data)) {
    return Promise.all(data.map(async (row) => {
      return executeFieldHooks(operation, fields, fullData, row, hookName);
    }));
  }

  const hookPromises = [];

  fields.forEach((field) => {
    if (typeof field.hooks[hookName] === 'function' && fullData[field.name]) {
      const hookPromise = async () => {
        fullData[field.name] = await field.hooks[hookName]({
          ...operation,
          data: fullData,
          value: data[field.name],
        });
      };

      hookPromises.push(hookPromise());
    }

    if (field.fields && data[field.name]) {
      const hookPromise = async () => {
        fullData[field.name] = await executeFieldHooks(operation, field.fields, fullData[field.name], hookName, data[field.name]);
      };

      hookPromises.push(hookPromise());
    }
  });

  await Promise.all(hookPromises);

  return fullData;
};

module.exports = executeFieldHooks;
