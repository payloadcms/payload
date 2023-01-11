import { Payload } from '../../../payload';
import resetPassword, { Result } from '../resetPassword';
import { PayloadRequest } from '../../../express/types';
import { getDataLoader } from '../../../collections/dataloader';
import i18n from '../../../translations/init';

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
    req = {} as PayloadRequest,
  } = options;

  const collection = payload.collections[collectionSlug];

  req.payload = payload;
  req.payloadAPI = 'local';
  req.i18n = i18n(payload.config.i18n);

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return resetPassword({
    collection,
    data,
    overrideAccess,
    req,
  });
}

export default localResetPassword;
