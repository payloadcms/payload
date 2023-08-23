import { sendEvent } from '..';
import { Payload } from '../../../payload';

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
