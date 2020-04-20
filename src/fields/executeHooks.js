const executeFieldHooks = async (fields, data, hookName) => {
  if (Array.isArray(data)) {
    const postHookData = await Promise.all(data.map(async (row) => {
      const rowData = await executeFieldHooks(fields, row, hookName);
      return rowData;
    }));

    return postHookData;
  }

  const postHookData = { ...data };
  const hookPromises = [];

  fields.forEach((field) => {
    if (typeof field.hooks[hookName] === 'function' && data[field.name]) {
      const hookPromise = async () => {
        postHookData[field.name] = await field.hooks[hookName](data[field.name]);
      };

      hookPromises.push(hookPromise());
    }

    if (field.fields && data[field.name]) {
      const hookPromise = async () => {
        postHookData[field.name] = await executeFieldHooks(field.fields, data[field.name], hookName);
      };

      hookPromises.push(hookPromise());
    }
  });

  await Promise.all(hookPromises);

  return postHookData;
};

module.exports = executeFieldHooks;
