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
    req,
  } = options;

  const collection = payload.collections[collectionSlug];

  const reqToUse = {
    ...req,
    payload,
    payloadAPI: 'local',
  } as PayloadRequest;

  reqToUse.payloadDataLoader = getDataLoader(reqToUse);

  return resetPassword({
    collection,
    data,
    overrideAccess,
    req: reqToUse,
  });
}

export default localResetPassword;
