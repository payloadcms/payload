import { sendEvent } from '../telemetry';
import { Payload } from '../../..';

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
