/* eslint-disable no-param-reassign */
import type { PayloadRequest, RequestContext } from './types'

/**
 * This makes sure that req.context always exists (is {}) and populates it with an optional default context.
 * This function mutates directly to avoid copying memory. As payloadRequest is not a primitive, the scope of the mutation is not limited to this function but should also be reflected in the calling function.
 */
export function setRequestContext(
  req: PayloadRequest = { context: null } as PayloadRequest,
  context: RequestContext = {},
) {
  if (req.context) {
    if (Object.keys(req.context).length === 0 && req.context.constructor === Object) {
      // check if req.context is just {}
      req.context = context // Faster - ... is bad for performance
    } else {
      req.context = { ...req.context, ...context } // Merge together
    }
  } else {
    req.context = context
  }
}
