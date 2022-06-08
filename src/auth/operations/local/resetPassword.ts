import { Payload } from '../../..';
import resetPassword, { Result } from '../resetPassword';
import { PayloadRequest } from '../../../express/types';

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

  return resetPassword({
    collection,
    data,
    overrideAccess,
    req: {
      ...req,
      payload,
      payloadAPI: 'local',
    } as PayloadRequest,
  });
}

export default localResetPassword;
