import type { CollectionSlug } from '../../../index.js'
import type { BeforeOperationArg, OperationMap } from './types.js'

import { operationToHookOperation } from './types.js'

/**
 * Runs a collection's `beforeOperation` hooks. `operation` is the literal operation
 * that was called (e.g. `find`, `findByID`, `findDistinct`, `deleteByID`, `updateByID`).
 * The args are returned with the same type that was passed in.
 */
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(
  operationArgs: {
    args: TArgs
    operation: keyof OperationMap<TOperationGeneric>
  } & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>,
): Promise<TArgs>

// Implementation
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug>(
  operationArgs: Omit<BeforeOperationArg<TOperationGeneric>, 'context' | 'req'>,
): Promise<unknown> {
  const { args, collection, operation, overrideAccess } = operationArgs

  let newArgs = args

  if (args.collection.config.hooks?.beforeOperation?.length) {
    // TODO: v4 should not need this mapping
    // Map the operation to the hook operation type for backward compatibility
    const hookOperation = operationToHookOperation[operation]

    for (const hook of args.collection.config.hooks.beforeOperation) {
      const hookResult = await hook({
        args: newArgs,
        collection,
        context: args.req!.context,
        operation: hookOperation,
        overrideAccess,
        req: args.req!,
      } as BeforeOperationArg<TOperationGeneric>)

      if (hookResult !== undefined) {
        newArgs = hookResult
      }
    }
  }

  return newArgs
}
