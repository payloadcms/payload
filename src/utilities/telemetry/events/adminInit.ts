import { PayloadRequest } from '../../../express/types';
import { sendEvent } from '../telemetry';

export type AdminInitEvent = {
  type: 'admin-init'
  domainID: string
}

export const adminInit = (req: PayloadRequest) => {
  const { host } = req.headers;
  if (!origin || origin.includes('localhost')) {
    return;
  }

  const domainID = req.payload.encrypt(host);

  sendEvent({
    payload: req.payload,
    event: {
      type: 'admin-init',
      domainID,
    },
  });
};
