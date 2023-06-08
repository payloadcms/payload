import type { PayloadRequest } from './types';

export function populateDefaultRequest(payloadRequest: PayloadRequest) {
  if (!payloadRequest.payloadContext) {
    // eslint-disable-next-line no-param-reassign
    payloadRequest.payloadContext = {}; // Mutate directly to avoid copying memory. As this is not a primitive, the scope of the mutation is not limited to this function but should also be reflected in the calling function.
  }
}
