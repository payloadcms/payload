import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../..';
import unlock from '../unlock';
import { getDataLoader } from '../../../collections/dataloader';

export type Options = {
  collection: string
  data: {
    email
  }
  req?: PayloadRequest
  overrideAccess: boolean
}

async function localUnlock(payload: Payload, options: Options): Promise<boolean> {
  const {
    collection: collectionSlug,
    data,
    overrideAccess = true,
    req: incomingReq = {},
  } = options;

  const collection = payload.collections[collectionSlug];

  const req = {
    ...incomingReq,
    payload,
    payloadAPI: 'local',
  } as PayloadRequest;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return unlock({
    data,
    collection,
    overrideAccess,
    req,
  });
}

export default localUnlock;
