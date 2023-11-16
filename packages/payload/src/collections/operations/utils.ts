import type forgotPassword from '../../auth/operations/forgotPassword'
import type login from '../../auth/operations/login'
import type refresh from '../../auth/operations/refresh'
import type { AfterOperationHook, SanitizedCollectionConfig, TypeWithID } from '../config/types'
import type create from './create'
import type deleteOperation from './delete'
import type deleteByID from './deleteByID'
import type find from './find'
import type findByID from './findByID'
import type update from './update'
import type updateByID from './updateByID'

export type AfterOperationMap<T extends TypeWithID> = {
  create: typeof create // todo: pass correct generic
  delete: typeof deleteOperation // todo: pass correct generic
  deleteByID: typeof deleteByID // todo: pass correct generic
  find: typeof find<T>
  findByID: typeof findByID<T>
  forgotPassword: typeof forgotPassword
  login: typeof login
  refresh: typeof refresh
  update: typeof update // todo: pass correct generic
  updateByID: typeof updateByID // todo: pass correct generic
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
