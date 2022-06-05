import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../..';
import unlock from '../unlock';

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

  return unlock({
    data,
    collection,
    overrideAccess,
    req: {
      ...req,
      payload,
      payloadAPI: 'local',
    } as PayloadRequest,
  });
}

export default localUnlock;
