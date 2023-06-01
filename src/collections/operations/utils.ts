import find from './find';
import update from './update';
import deleteOperation from './delete';
import create from './create';
import login from '../../auth/operations/login';
import refresh from '../../auth/operations/refresh';
import findByID from './findByID';
import updateByID from './updateByID';
import deleteByID from './deleteByID';
import { TypeWithID } from '../config/types';
import forgotPassword from '../../auth/operations/forgotPassword';

export type AfterOperationMap<
  O extends keyof AfterOperationMap = any,
  T extends O extends 'find' ? TypeWithID & Record<string, unknown> : any = any,
> = {
  create: typeof create,
  find: typeof find<T>,
  findByID: typeof findByID,
  update: typeof update,
  updateByID: typeof updateByID,
  delete: typeof deleteOperation,
  deleteByID: typeof deleteByID,
  login: typeof login,
  refresh: typeof refresh,
  forgotPassword: typeof forgotPassword,
}

export const buildAfterOperation = async <
  O extends keyof AfterOperationMap,
  T extends TypeWithID & Record<string, unknown> = any,
>(operationArgs: {
  operation: O;
  args: Parameters<AfterOperationMap<O, T>[O]>[0];
  result: Awaited<ReturnType<AfterOperationMap<O, T>[O]>>;
}): Promise<ReturnType<AfterOperationMap<O, T>[O]>> => {
  const {
    operation,
    args,
    result,
  } = operationArgs;

  let newResult = result;

  await args.collection.config.hooks.afterOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    const hookResult = await hook<O, T>({
      operation,
      args,
      result: newResult,
    });

    if (hookResult !== undefined) {
      newResult = hookResult;
    }
  }, Promise.resolve());

  return newResult;
};
