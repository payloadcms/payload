import { sendEvent } from '../index.js';
import { Payload } from '../../../payload.js';

export type ServerInitEvent = {
  type: 'server-init'
};

export const serverInit = (payload: Payload): void => {
  sendEvent({
    payload,
    event: {
      type: 'server-init',
    },
  });
};
