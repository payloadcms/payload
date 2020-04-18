/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const executeFieldHooks = async (fields, data, hookName) => {
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
