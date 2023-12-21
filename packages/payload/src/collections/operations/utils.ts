import type { forgotPasswordOperation } from '../../auth/operations/forgotPassword'
import type { loginOperation } from '../../auth/operations/login'
import type { refreshOperation } from '../../auth/operations/refresh'
import type { AfterOperationHook, SanitizedCollectionConfig, TypeWithID } from '../config/types'
import type { createOperation } from './create'
import type { deleteOperation } from './delete'
import type { deleteByIDOperation } from './deleteByID'
import type { findOperation } from './find'
import type { findByIDOperation } from './findByID'
import type { updateOperation } from './update'
import type { updateByIDOperation } from './updateByID'

export type AfterOperationMap<T extends TypeWithID> = {
  create: typeof createOperation // todo: pass correct generic
  delete: typeof deleteOperation // todo: pass correct generic
  deleteByID: typeof deleteByIDOperation // todo: pass correct generic
  find: typeof findOperation<T>
  findByID: typeof findByIDOperation<T>
  forgotPassword: typeof forgotPasswordOperation
  login: typeof loginOperation
  refresh: typeof refreshOperation
  update: typeof updateOperation // todo: pass correct generic
  updateByID: typeof updateByIDOperation // todo: pass correct generic
}
export type AfterOperationArg<T extends TypeWithID> =
  | {
      args: Parameters<AfterOperationMap<T>['create']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'create'
      result: Awaited<ReturnType<AfterOperationMap<T>['create']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['delete']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'delete'
      result: Awaited<ReturnType<AfterOperationMap<T>['delete']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['deleteByID']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'deleteByID'
      result: Awaited<ReturnType<AfterOperationMap<T>['deleteByID']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['find']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'find'
      result: Awaited<ReturnType<AfterOperationMap<T>['find']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['findByID']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'findByID'
      result: Awaited<ReturnType<AfterOperationMap<T>['findByID']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['forgotPassword']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'forgotPassword'
      result: Awaited<ReturnType<AfterOperationMap<T>['forgotPassword']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['login']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'login'
      result: Awaited<ReturnType<AfterOperationMap<T>['login']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['refresh']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'refresh'
      result: Awaited<ReturnType<AfterOperationMap<T>['refresh']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['update']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'update'
      result: Awaited<ReturnType<AfterOperationMap<T>['update']>>
    }
  | {
      args: Parameters<AfterOperationMap<T>['updateByID']>[0]
      /** The collection which this hook is being run on */
      collection: SanitizedCollectionConfig
      operation: 'updateByID'
      result: Awaited<ReturnType<AfterOperationMap<T>['updateByID']>>
    }

// export type AfterOperationHook = typeof buildAfterOperation;

export const buildAfterOperation = async <
  T extends TypeWithID = any,
  O extends keyof AfterOperationMap<T> = keyof AfterOperationMap<T>,
>(
  operationArgs: AfterOperationArg<T> & { operation: O },
): Promise<Awaited<ReturnType<AfterOperationMap<T>[O]>>> => {
  const { args, collection, operation, result } = operationArgs

  let newResult = result

  await args.collection.config.hooks.afterOperation.reduce(
    async (priorHook, hook: AfterOperationHook<T>) => {
      await priorHook

      const hookResult = await hook({
        args,
        collection,
        operation,
        result: newResult,
      } as AfterOperationArg<T>)

      if (hookResult !== undefined) {
        newResult = hookResult
      }
    },
    Promise.resolve(),
  )

  return newResult
}
