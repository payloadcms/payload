import { OperationArguments } from '../types';

const hookPromise = async ({
  data,
  field,
  hook,
  req,
  operation,
  fullOriginalDoc,
  fullData,
}: OperationArguments): Promise<void> => {
  const resultingData = data;

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

export default hookPromise;
