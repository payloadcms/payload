/* eslint-disable no-param-reassign */
import type { PayloadRequest, PayloadRequestContext } from './types';

/**
 * This makes sure that payloadRequest.payloadContext always exists (is {}) and populates it with an optional default context.
 * This function mutates directly to avoid copying memory. As payloadRequest is not a primitive, the scope of the mutation is not limited to this function but should also be reflected in the calling function.
 */
export function setRequestContext(req: PayloadRequest = { payloadContext: null } as PayloadRequest, context: PayloadRequestContext = {}) {
  if (req.payloadContext) {
    if (Object.keys(req.payloadContext).length === 0 && req.payloadContext.constructor === Object) { // check if req.payloadContext is just {}
      req.payloadContext = context; // Faster - ... is bad for performance
    } else {
      req.payloadContext = { ...req.payloadContext, ...context }; // Merge together
    }
  } else {
    req.payloadContext = context;
  }
}
