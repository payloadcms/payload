import type { Operation, PayloadRequest } from '../types/index.js'

import { isolateObjectProperty } from './isolateObjectProperty.js'

/**
 * Returns a request view whose active operation is isolated from the caller and sibling access
 * policies. Runtime services and transaction identity remain shared with the original request.
 */
export function getAccessOperationRequest({
  operation,
  req,
}: {
  operation: Operation
  req: PayloadRequest
}): PayloadRequest {
  const operationRequest = isolateObjectProperty(req, 'operation')

  operationRequest.operation = operation

  return operationRequest
}
