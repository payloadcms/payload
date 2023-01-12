import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../..';
import unlock from '../unlock';
import { getDataLoader } from '../../../collections/dataloader';
import i18n from '../../../translations/init';
import { APIError } from '../../../errors';

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
    req = {} as PayloadRequest,
  } = options;

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${collectionSlug} can't be found.`);
  }

  req.payload = payload;
  req.payloadAPI = 'local';
  req.i18n = i18n(payload.config.i18n);

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return unlock({
    data,
    collection,
    overrideAccess,
    req,
  });
}

export default localUnlock;
