import { PayloadRequest } from '../../../express/types';
import { sendEvent } from '..';
import { oneWayHash } from '../oneWayHash';

export type AdminInitEvent = {
  type: 'admin-init'
  domainID?: string
  userID?: string
}

export const adminInit = (req: PayloadRequest): void => {
  const { user, payload } = req;
  const { host } = req.headers;

  let domainID: string;
  let userID: string;

  if (host) {
    domainID = oneWayHash(host, payload.secret);
  }

  if (user && typeof user?.id === 'string') {
    userID = oneWayHash(user.id, payload.secret);
  }

  sendEvent({
    payload,
    event: {
      type: 'admin-init',
      domainID,
      userID,
    },
  });
};
