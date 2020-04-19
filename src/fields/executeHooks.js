/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const executeFieldHooks = async (fields, data, hookName) => {
  if (Array.isArray(data)) {
    const postHookData = await Promise.all(data.map(async (row) => {
      const rowData = await executeFieldHooks(fields, row, hookName);
      return rowData;
    }));

    return postHookData;
  }

  const postHookData = { ...data };

  for (const field of fields) {
    if (typeof field.hooks[hookName] === 'function' && data[field.name]) {
      postHookData[field.name] = await field.hooks[hookName](data[field.name]);
    }

    if (field.fields && data[field.name]) {
      postHookData[field.name] = await executeFieldHooks(field.fields, data[field.name], hookName);
    }
  }

  return postHookData;
};

module.exports = executeFieldHooks;
