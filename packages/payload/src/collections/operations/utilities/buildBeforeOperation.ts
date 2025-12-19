import type { CollectionSlug } from '../../../index.js'
import type { BeforeOperationArg, OperationArgs, OperationMap } from './types.js'

import { operationToHookOperation } from './types.js'
// Specific overloads with TArgs (these take priority over the general overload)
// Overload for 'read' operation (deprecated, backward compatibility)

/**
 * TODO V4: remove overloads and operations should be the literal operation that was called
 *
 * - `read`: replace with `find` and `findByID` in both operations
 * - `delete`: replace with `deleteByID` in deleteByID operation
 * - `update`: replace with `updateByID` in updateByID operation
 */

/**
 * @deprecated
 *
 * Should use `find` or `findByID`
 */
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(
  operationArgs: {
    args: TArgs
    operation: 'read'
  } & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>,
): Promise<TArgs>

/**
 * Overload for 'readDistinct' operation
 *
 * @deprecated - use `findDistinct`
 */
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(
  operationArgs: {
    args: TArgs
    operation: 'readDistinct'
  } & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>,
): Promise<TArgs>

// Overload for 'update' operation (can be called by both update and updateByID)
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(
  operationArgs: {
    args: TArgs
    operation: 'update'
  } & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>,
): Promise<TArgs>

// Overload for 'updateByID' operation
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(
  operationArgs: {
    args: TArgs
    operation: 'updateByID'
  } & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>,
): Promise<TArgs>

export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(
  operationArgs: {
    args: TArgs
    operation: 'delete'
  } & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>,
): Promise<TArgs>

// Overload for 'deleteByID' operation
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(
  operationArgs: {
    args: TArgs
    operation: 'deleteByID'
  } & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>,
): Promise<TArgs>

// General overload for operations that exist in OperationMap (fallback)
export async function buildBeforeOperation<
  TOperationGeneric extends CollectionSlug,
  O extends keyof OperationMap<TOperationGeneric>,
>(
  operationArgs: { operation: O } & Omit<BeforeOperationArg<TOperationGeneric>, 'context' | 'req'>,
): Promise<OperationArgs<TOperationGeneric, O>>

// Implementation
export async function buildBeforeOperation<TOperationGeneric extends CollectionSlug>(
  operationArgs: Omit<BeforeOperationArg<TOperationGeneric>, 'context' | 'req'>,
): Promise<unknown> {
  const { args, collection, operation } = operationArgs

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
        req: args.req!,
      } as BeforeOperationArg<TOperationGeneric>)

      if (hookResult !== undefined) {
        newArgs = hookResult
      }
    }
  }

  return newArgs
}
