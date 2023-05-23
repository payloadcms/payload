import deepCopyObject from '../../utilities/deepCopyObject';
import { HookOperationType } from '../config/types';

export const buildAfterOperation = async (args, result, operationType: HookOperationType) => {
  let newResult = deepCopyObject(result);
  await args.collection.config.hooks.afterOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    const hookResult = await hook({
      args,
      operation: operationType,
      result: newResult,
    });

    if (hookResult !== undefined) {
      newResult = hookResult;
    }
  }, Promise.resolve());

  return newResult;
};
