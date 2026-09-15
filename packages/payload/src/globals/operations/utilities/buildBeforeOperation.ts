import type { GlobalSlug } from '../../../index.js'
import type { BeforeOperationArg, OperationArgs, OperationMap } from './types.js'

// General overload for operations that exist in OperationMap (fallback)
export async function buildBeforeOperation<
  TOperationGeneric extends GlobalSlug,
  O extends keyof OperationMap<TOperationGeneric>,
>(
  operationArgs: { operation: O } & Omit<BeforeOperationArg<TOperationGeneric>, 'context' | 'req'>,
): Promise<OperationArgs<TOperationGeneric, O>>

// Implementation
export async function buildBeforeOperation<TOperationGeneric extends GlobalSlug>(
  operationArgs: Omit<BeforeOperationArg<TOperationGeneric>, 'context' | 'req'>,
): Promise<unknown> {
  const { args, global, operation, overrideAccess } = operationArgs

  let newArgs = args

  if (global.hooks?.beforeOperation?.length) {
    for (const hook of global.hooks.beforeOperation) {
      const hookResult = await hook({
        args: newArgs,
        context: args.req!.context,
        global,
        operation,
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
