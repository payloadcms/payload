const executeFieldHooks = async (fields, data, hook) => {
  for (const field of fields) {
    if (typeof field.hooks[hook] === 'function') {
      const result = await field.hooks[hook](data);
    }
  }
};

module.exports = executeFieldHooks;
