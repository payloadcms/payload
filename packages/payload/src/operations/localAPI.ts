import type { z } from 'zod'

import type { PayloadRequest } from '../types/index.js'
import type {
  OperationHandler,
  OperationLocalDefinition,
  PayloadOperation,
} from './defineOperation.js'

import { invokeOperation } from './defineOperation.js'

type AnyLocalOperation = {
  expose: {
    local?: OperationLocalDefinition
  }
  handler: (context: never, input: never) => Promise<unknown>
  input: z.ZodType
}

type OperationRegistry = readonly AnyLocalOperation[]

type InvokableLocalOperation = PayloadOperation<
  OperationHandler<unknown, unknown, unknown>,
  z.ZodType
>

type LocalAPIRequest = {
  payload?: unknown
  payloadDataLoader?: unknown
} & Omit<Partial<PayloadRequest>, 'payload' | 'payloadDataLoader'>

export type LocalAPIOptions<TOptions> = {
  req?: LocalAPIRequest
} & Omit<TOptions, 'req'>

type LocalAPIFromDefinition<TDefinition> =
  TDefinition extends OperationLocalDefinition<infer TName, infer TMethod>
    ? {
        [TKey in TName]: TMethod extends (...args: never[]) => unknown ? TMethod : never
      }
    : never

export type LocalAPIFromDefinitions<TDefinitions extends OperationLocalDefinition> =
  UnionToIntersection<LocalAPIFromDefinition<TDefinitions>>

type OperationFromRegistry<TRegistry> = TRegistry extends readonly (infer TOperation)[]
  ? TOperation
  : never

type LocalAPIMember<TOperation> = TOperation extends {
  expose: {
    local: OperationLocalDefinition<infer TName, infer TMethod>
  }
  handler: infer THandler extends (...args: never[]) => unknown
  input: infer TInput extends z.ZodType
}
  ? {
      [TKey in TName]: TMethod extends (...args: never[]) => unknown
        ? TMethod
        : (input: z.input<TInput>) => ReturnType<THandler>
    }
  : unknown

type UnionToIntersection<TUnion> = (
  TUnion extends unknown ? (value: TUnion) => void : never
) extends (value: infer TIntersection) => void
  ? TIntersection
  : never

/**
 * Derives Local API methods from a complete operation registry.
 *
 * By default, inputs come from the operation's Zod schema and results come from its executor.
 * `defineLocalAPI<TMethod>()` can retain a richer generic or overloaded public signature.
 */
export type LocalAPIFromOperations<TRegistry> = {
  [TKey in keyof UnionToIntersection<
    LocalAPIMember<OperationFromRegistry<TRegistry>>
  >]: UnionToIntersection<LocalAPIMember<OperationFromRegistry<TRegistry>>>[TKey]
}

/**
 * Creates the public Local API from operation metadata.
 *
 * Local API calls intentionally disable schema parsing. They retain the established Local API
 * defaults and coercion behavior while still using the same generic operation invocation path.
 */
export const operationsToLocalAPI = <TRegistry extends OperationRegistry>({
  context,
  operations,
}: {
  context: unknown
  operations: TRegistry
}): LocalAPIFromOperations<TRegistry> => {
  const localAPI: Record<string, (input: unknown) => Promise<unknown>> = {}

  for (const operation of operations) {
    if (!operation.expose.local) {
      continue
    }

    localAPI[operation.expose.local.name] = async (input) => {
      const result = await invokeOperation(operation as unknown as InvokableLocalOperation, {
        context,
        input,
        validate: false,
      })

      if (operation.expose.local?.afterHandler) {
        return operation.expose.local.afterHandler({ context, input, result } as never)
      }

      return result
    }
  }

  return localAPI as LocalAPIFromOperations<TRegistry>
}
