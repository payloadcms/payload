import { Payload } from '../../..';
import resetPassword, { Result } from '../resetPassword';
import { PayloadRequest } from '../../../express/types';
import { getDataLoader } from '../../../collections/dataloader';

export type Options = {
  collection: string
  data: {
    token: string
    password: string
  }
  overrideAccess: boolean
  req?: PayloadRequest
}

async function localResetPassword(payload: Payload, options: Options): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    overrideAccess,
    req: incomingReq = {},
  } = options;

  const collection = payload.collections[collectionSlug];

  const req = {
    ...incomingReq,
    payload,
    payloadAPI: 'local',
  } as PayloadRequest;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return resetPassword({
    collection,
    data,
    overrideAccess,
    req,
  });
}

export default localResetPassword;
