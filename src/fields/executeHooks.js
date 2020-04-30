const executeFieldHooks = async (operation, fields, value, hookName, data = null) => {
  const fullData = data || value;
  if (Array.isArray(data)) {
    return Promise.all(data.map(async (row) => {
      return executeFieldHooks(operation, fields, fullData, row, hookName);
    }));
  }

  const postHookData = Object.create(fullData);

  const hookPromises = [];

  fields.forEach((field) => {
    if (typeof field.hooks[hookName] === 'function' && data[field.name]) {
      const hookPromise = async () => {
        postHookData[field.name] = await field.hooks[hookName]({
          ...operation,
          data: fullData,
          value: data[field.name],
        });
      };

      hookPromises.push(hookPromise());
    }

    if (field.fields && data[field.name]) {
      const hookPromise = async () => {
        postHookData[field.name] = await executeFieldHooks(operation, field.fields, fullData, hookName, data[field.name]);
      };

      hookPromises.push(hookPromise());
    }
  });

  await Promise.all(hookPromises);

  return postHookData;
};

module.exports = executeFieldHooks;
