import type { z } from 'zod'

import type { Endpoint, PayloadHandler } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

type AnyOperationHandler = (context: never, input: never) => Promise<unknown>
type AnyLocalAPIMethod = (input: never) => Promise<unknown>
type MaybePromise<T> = Promise<T> | T

export type OperationHandler<TContext = unknown, TInput = unknown, TResult = unknown> = (
  context: TContext,
  input: TInput,
) => Promise<TResult>

export type OperationLocalAfterHandlerArgs<THandler extends AnyOperationHandler> = {
  context: Parameters<THandler>[0]
  input: Parameters<THandler>[1]
  result: Awaited<ReturnType<THandler>>
}

export type OperationLocalDefinition<
  TName extends string = string,
  TMethod extends AnyLocalAPIMethod | undefined = AnyLocalAPIMethod | undefined,
> = Readonly<{
  afterHandler?: (args: never) => MaybePromise<unknown>
  /**
   * Type-only marker used to retain generic and overloaded Local API signatures.
   * It is intentionally absent at runtime.
   */
  method?: TMethod
  name: TName
}>

/**
 * Adds a public Local API signature to an operation without duplicating a runtime method.
 *
 * Zod-derived signatures can omit `TMethod`. Operations with richer generic, overloaded, or
 * post-processed contracts can supply their exact public method type here.
 */
export const defineLocalAPI =
  <TMethod extends AnyLocalAPIMethod | undefined = undefined>() =>
  <const TName extends string>({
    name,
    afterHandler,
  }: {
    afterHandler?: (args: never) => MaybePromise<unknown>
    name: TName
  }): OperationLocalDefinition<TName, TMethod> => ({
    name,
    afterHandler,
  })

export type OperationInvocationOptions = {
  /**
   * Set to `false` when an adapter already parsed its input and intentionally needs the public
   * interface's backwards-compatible coercion semantics. REST and the Local API use this; MCP and
   * a future CLI validate their external inputs.
   *
   * @default true
   */
  validate?: boolean
}

/**
 * The semantic target of an operation. Unlike the previous REST scope, this identifies what the
 * operation acts on and is shared by every adapter.
 */
export type OperationTarget =
  | 'auth'
  | 'collection'
  | 'global'
  | 'jobs'
  | 'root'
  | 'upload'
  | 'uploadCollection'

export type OperationRESTExposure<
  THandler extends AnyOperationHandler,
  TInput extends z.ZodType,
> = {
  /**
   * Adapter escape hatch for interfaces whose behavior is inherently HTTP-specific, such as
   * cookie mutation, streaming, or raw request bodies. Ordinary operations should be handled by
   * the generic REST adapter.
   */
  handler?: (args: {
    invoke: (args: OperationInvocationArgs<THandler, TInput>) => ReturnType<THandler>
    operation: PayloadOperation<THandler, TInput>
    req: PayloadRequest
  }) => ReturnType<PayloadHandler>
  /**
   * Set to `false` for raw-body handlers that must read the request stream themselves.
   *
   * @default true
   */
  wrapInternal?: boolean
} & Omit<Endpoint, 'handler'>

export type OperationExposures<
  THandler extends AnyOperationHandler,
  TInput extends z.ZodType,
  TLocal extends OperationLocalDefinition | undefined = OperationLocalDefinition | undefined,
> = Readonly<{
  cli?: false | Readonly<{ name?: string }> | true
  graphql?: false | Readonly<{ name?: string }> | true
  local?: TLocal
  mcp?: false | Readonly<{ name: string }> | true
  rest?: readonly OperationRESTExposure<THandler, TInput>[]
}>

type OperationInvocationArgs<THandler extends AnyOperationHandler, TInput extends z.ZodType> = {
  context: Parameters<THandler>[0]
} & (
  | {
      input: Parameters<THandler>[1]
      validate: false
    }
  | {
      input: z.input<TInput>
      validate?: true
    }
)

type OperationValidatedArgs<THandler extends AnyOperationHandler, TInput extends z.ZodType> = {
  context: Parameters<THandler>[0]
  input: z.output<TInput>
}

/**
 * A Payload operation has one semantic identity, one input contract, and one implementation.
 * Local API, REST, GraphQL, MCP, and CLI adapters expose this definition in their own protocols.
 */
export type PayloadOperation<
  THandler extends AnyOperationHandler = AnyOperationHandler,
  TInput extends z.ZodType = z.ZodType,
  TTarget extends OperationTarget = OperationTarget,
  TAction extends string = string,
  TLocal extends OperationLocalDefinition | undefined = OperationLocalDefinition | undefined,
> = Readonly<{
  action: TAction
  expose: OperationExposures<THandler, TInput, TLocal>
  getDataSchema?: (
    args: { permissions?: unknown } & OperationValidatedArgs<THandler, TInput>,
  ) => unknown
  handler: THandler
  input: TInput
  target: TTarget
}>

export const defineOperation = <
  const TTarget extends OperationTarget,
  const TAction extends string,
  THandler extends AnyOperationHandler,
  TInput extends z.ZodType = z.ZodType,
  TLocal extends OperationLocalDefinition | undefined = undefined,
>({
  action,
  expose,
  getDataSchema,
  handler,
  input,
  target,
}: {
  action: TAction
  expose?: OperationExposures<THandler, TInput, TLocal>
  getDataSchema?: (
    args: { permissions?: unknown } & OperationValidatedArgs<THandler, TInput>,
  ) => unknown
  handler: THandler
  input: TInput
  target: TTarget
}): PayloadOperation<THandler, TInput, TTarget, TAction, TLocal> => ({
  action,
  expose: expose ?? {},
  getDataSchema,
  handler,
  input,
  target,
})

/**
 * The one invocation path shared by validating external adapters.
 *
 * An operation itself only owns `handler`; this function provides schema parsing without adding a
 * second execution method to every operation object.
 */
export const invokeOperation = async <
  THandler extends AnyOperationHandler,
  TInput extends z.ZodType,
>(
  operation: PayloadOperation<THandler, TInput>,
  { context, input, validate = true }: OperationInvocationArgs<THandler, TInput>,
): Promise<Awaited<ReturnType<THandler>>> => {
  const parsedInput = validate ? operation.input.parse(input) : input

  return operation.handler(context, parsedInput as Parameters<THandler>[1]) as Promise<
    Awaited<ReturnType<THandler>>
  >
}
