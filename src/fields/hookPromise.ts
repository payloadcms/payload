import { PayloadRequest } from '../express/types';
import { Operation } from '../types';
import { Field, HookName } from './config/types';

type Arguments = {
  data: Record<string, unknown>
  field: Field
  hook: HookName
  req: PayloadRequest
  operation: Operation
  fullOriginalDoc: Record<string, unknown>
  fullData: Record<string, unknown>
}

const hookPromise = async ({
  data,
  field,
  hook,
  req,
  operation,
  fullOriginalDoc,
  fullData,
}: Arguments): Promise<void> => {
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
