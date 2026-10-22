import type { Operation, PayloadRequest } from '../types/index.js'

import { forkSelectedBranchRequest } from '../versions/branches/operations/selectedBranchContext.js'
import { forkBranchReadRequest } from './createBranchReadRequest.js'
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
  const scoped = forkBranchReadRequest({ req })
  const selected = scoped === req ? forkSelectedBranchRequest({ req }) : scoped
  const operationRequest =
    selected === req ? isolateObjectProperty(req, 'operation') : (selected as PayloadRequest)

  operationRequest.operation = operation

  return operationRequest
}
