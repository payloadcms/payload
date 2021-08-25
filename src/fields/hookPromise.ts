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

const hookPromise = ({
  data,
  field,
  hook,
  req,
  operation,
  fullOriginalDoc,
  fullData,
}: Arguments) => async (): Promise<void> => {
  const resultingData = data;

  if (field.hooks && field.hooks[hook]) {
    await field.hooks[hook].reduce(async (priorHook, currentHook) => {
      await priorHook;

      let hookedValue = await currentHook({
        value: data[field.name],
        originalDoc: fullOriginalDoc,
        data: fullData,
        operation,
        req,
      });

      if (typeof hookedValue === 'undefined') {
        hookedValue = data[field.name];
      }

      if (hookedValue !== undefined) {
        resultingData[field.name] = hookedValue;
      }
    }, Promise.resolve());
  }
};

export default hookPromise;
