const hookPromise = async ({
  data,
  field,
  hook,
  req,
  operation,
  fullOriginalDoc,
  fullData,
}) => {
  const resultingData = data;

  if ((field.type === 'relationship' || field.type === 'upload') && (data[field.name] === 'null' || data[field.name] === null)) {
    resultingData[field.name] = null;
  }

  if (field.hooks && field.hooks[hook]) {
    await field.hooks[hook].reduce(async (priorHook, currentHook) => {
      await priorHook;

      const hookedValue = await currentHook({
        value: data[field.name],
        originalDoc: fullOriginalDoc,
        data: fullData,
        operation,
        req,
      }) || data[field.name];

      if (hookedValue !== undefined) {
        resultingData[field.name] = hookedValue;
      }
    }, Promise.resolve());
  }
};

module.exports = hookPromise;
