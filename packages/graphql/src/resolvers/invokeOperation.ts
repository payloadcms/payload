import type {
  OperationHandler,
  Payload,
  PayloadOperation,
  PayloadOperationAction,
  PayloadOperationByTargetAndAction,
  PayloadOperationTarget,
  PayloadRequest,
} from 'payload'

import { getPayloadOperation, invokeOperation } from 'payload'

type RegisteredOperation<
  TTarget extends PayloadOperationTarget,
  TAction extends PayloadOperationAction<TTarget>,
> = PayloadOperationByTargetAndAction<TTarget, TAction>

/** Invokes the shared Payload operation after a GraphQL resolver has shaped its input. */
export const invokeGraphQLOperation = <
  TTarget extends PayloadOperationTarget,
  TAction extends PayloadOperationAction<TTarget>,
>(
  req: PayloadRequest,
  target: TTarget,
  action: TAction,
  input: Parameters<RegisteredOperation<TTarget, TAction>['handler']>[1],
): Promise<Awaited<ReturnType<RegisteredOperation<TTarget, TAction>['handler']>>> =>
  invokeOperation(
    getPayloadOperation(target, action) as unknown as PayloadOperation<
      OperationHandler<Payload, unknown, unknown>
    >,
    {
      context: req.payload,
      input,
      validate: false,
    },
  ) as Promise<Awaited<ReturnType<RegisteredOperation<TTarget, TAction>['handler']>>>
