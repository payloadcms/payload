import type { CollectionSlug } from '../../../index.js'
import type { AfterOperationArg, OperationMap, OperationResult } from './types.js'

export const buildAfterOperation = async <
  TOperationGeneric extends CollectionSlug,
  O extends keyof OperationMap<TOperationGeneric> = keyof OperationMap<TOperationGeneric>,
>(
  operationArgs: { operation: O } & Omit<AfterOperationArg<TOperationGeneric>, 'req'>,
): Promise<any | OperationResult<TOperationGeneric, O>> => {
  const { args, collection, operation, overrideAccess, result } = operationArgs

  let newResult = result as OperationResult<TOperationGeneric, O>

  if (args.collection.config.hooks?.afterOperation?.length) {
    for (const hook of args.collection.config.hooks.afterOperation) {
      const hookResult = await hook({
        args,
        collection,
        operation,
        overrideAccess,
        req: args.req,
        result: newResult,
      } as AfterOperationArg<TOperationGeneric>)

      if (hookResult !== undefined) {
        newResult = hookResult as OperationResult<TOperationGeneric, O>
      }
    }
  }

  return newResult
}
