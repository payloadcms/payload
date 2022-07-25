import { PayloadRequest } from '../../../express/types';
import forgotPassword, { Result } from '../forgotPassword';
import { Payload } from '../../..';
import { getDataLoader } from '../../../collections/dataloader';

export type Options = {
  collection: string
  data: {
    email: string
  }
  expiration?: number
  disableEmail?: boolean
  req?: PayloadRequest
}

async function localForgotPassword(payload: Payload, options: Options): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    expiration,
    disableEmail,
    req = {},
  } = options;

  const collection = payload.collections[collectionSlug];

  const reqToUse = {
    ...req,
    payloadAPI: 'local',
  } as PayloadRequest;

  reqToUse.payloadDataLoader = getDataLoader(reqToUse);

  return forgotPassword({
    data,
    collection,
    disableEmail,
    expiration,
    req: reqToUse,
  });
}

export default localForgotPassword;
