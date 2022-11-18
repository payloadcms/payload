import { PayloadRequest } from '../../../express/types';
import forgotPassword, { Result } from '../forgotPassword';
import { Payload } from '../../..';
import { getDataLoader } from '../../../collections/dataloader';
import i18n from '../../../translations/init';

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
    req = {} as PayloadRequest,
  } = options;

  const collection = payload.collections[collectionSlug];

  req.payloadAPI = 'local';
  req.i18n = i18n(payload.config.i18n);

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return forgotPassword({
    data,
    collection,
    disableEmail,
    expiration,
    req,
  });
}

export default localForgotPassword;
