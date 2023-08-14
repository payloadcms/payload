import { Config as GeneratedTypes } from 'payload/generated-types';
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
  T extends TypeWithID & {slug: keyof GeneratedTypes['collections']} & Record<string, unknown> = any,
> = {
  create: typeof create<T['slug']>,
  find: typeof find<T>,
  findByID: typeof findByID<T>,
  update: typeof update<T['slug']>,
  updateByID: typeof updateByID<T['slug']>,
  delete: typeof deleteOperation<T['slug']>,
  deleteByID: typeof deleteByID<T['slug']>,
  login: typeof login,
  refresh: typeof refresh,
  forgotPassword: typeof forgotPassword,
}
type AfterOperationArg<O extends keyof AfterOperationMap, T extends TypeWithID & {slug: keyof GeneratedTypes['collections']} & Record<string, unknown> = any> =
  | { operation: 'create'; result: Awaited<ReturnType<AfterOperationMap<O, T>['create']>>, args: Parameters<AfterOperationMap<O, T>['create']>[0] }
  | { operation: 'find'; result: Awaited<ReturnType<AfterOperationMap<O, T>['find']>>, args: Parameters<AfterOperationMap<O, T>[O]>['find'] }
  | { operation: 'findByID'; result: Awaited<ReturnType<AfterOperationMap<O, T>['findByID']>>, args: Parameters<AfterOperationMap<O, T>['findByID']>[0] }
  | { operation: 'update'; result: Awaited<ReturnType<AfterOperationMap<O, T>['update']>>, args: Parameters<AfterOperationMap<O, T>['update']>[0] }
  | { operation: 'updateByID'; result: Awaited<ReturnType<AfterOperationMap<O, T>['updateByID']>>, args: Parameters<AfterOperationMap<O, T>['updateByID']>[0] }
  | { operation: 'delete'; result: Awaited<ReturnType<AfterOperationMap<O, T>['delete']>>, args: Parameters<AfterOperationMap<O, T>['delete']>[0] }
  | { operation: 'deleteByID'; result: Awaited<ReturnType<AfterOperationMap<O, T>['deleteByID']>>, args: Parameters<AfterOperationMap<O, T>['deleteByID']>[0] }
  | { operation: 'login'; result: Awaited<ReturnType<AfterOperationMap<O, T>['login']>>, args: Parameters<AfterOperationMap<O, T>['login']>[0] }
  | { operation: 'refresh'; result: Awaited<ReturnType<AfterOperationMap<O, T>['refresh']>>, args: Parameters<AfterOperationMap<O, T>['refresh']>[0] }
  | { operation: 'forgotPassword'; result: Awaited<ReturnType<AfterOperationMap<O, T>['forgotPassword']>>, args: Parameters<AfterOperationMap<O, T>['forgotPassword']>[0] }
  ;

// export type AfterOperationHook = typeof buildAfterOperation;


export type AfterOperationHook2<
  T extends TypeWithID & {slug: keyof GeneratedTypes['collections']} & Record<string, unknown> = any,
  O extends keyof AfterOperationMap = keyof AfterOperationMap
> = (
    arg: AfterOperationArg<O, T>,
    aa?: {
      type: T,
    }
  ) => Promise<ReturnType<AfterOperationMap<O, T>[O]>>;

export const buildAfterOperation = async <
  O extends keyof AfterOperationMap,
  T extends TypeWithID & {slug: keyof GeneratedTypes['collections']} & Record<string, unknown> = any>
(
  operationArgs: {
      operation: O;
      args: Parameters<AfterOperationMap<O, T>[O]>[0];
      result: Awaited<ReturnType<AfterOperationMap<O, T>[O]>>;
    },
): Promise<ReturnType<AfterOperationMap<O, T>[O]>> => {
  const {
    operation,
    args,
    result,
  } = operationArgs;

  let newResult = result;

  await args.collection.config.hooks.afterOperation.reduce(async (priorHook, hook: AfterOperationHook2<T, O>) => {
    await priorHook;

    const hookResult = await hook({
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
