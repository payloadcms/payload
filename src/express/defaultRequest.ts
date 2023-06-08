/* eslint-disable no-param-reassign */
import type { PayloadRequest, PayloadRequestContext } from './types';

/**
 * This makes sure that payloadRequest.payloadContext always exists (is {}) and populates it with an optional default context.
 * This function mutates directly to avoid copying memory. As payloadRequest is not a primitive, the scope of the mutation is not limited to this function but should also be reflected in the calling function.
 */
export function populateDefaultRequest(payloadRequest: PayloadRequest|undefined, context?: PayloadRequestContext|undefined) {
  if (!payloadRequest) {
    payloadRequest = {
      payloadContext: context ?? {},
    } as PayloadRequest;
  } else if (!payloadRequest.payloadContext) {
    payloadRequest.payloadContext = context ?? {};
  } else if (context) { // context is set - // Merge req.payloadContext with context
    // check if req.payloadContext is just {}
    if (Object.keys(payloadRequest.payloadContext).length === 0 && payloadRequest.payloadContext.constructor === Object) {
      payloadRequest.payloadContext = context; // Faster - ... is bad for performance
    } else {
      payloadRequest.payloadContext = { ...payloadRequest.payloadContext, ...context }; // Merge together
    }
  }
}
