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
    req,
  } = options;

  const collection = payload.collections[collectionSlug];

  const reqToUse = {
    ...req,
    payload,
    payloadAPI: 'local',
  } as PayloadRequest;

  reqToUse.payloadDataLoader = getDataLoader(reqToUse);

  return unlock({
    data,
    collection,
    overrideAccess,
    req: reqToUse,
  });
}

export default localUnlock;
