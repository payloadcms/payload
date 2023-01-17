import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../../payload';
import unlock from '../unlock';
import { getDataLoader } from '../../../collections/dataloader';
import i18n from '../../../translations/init';
import { APIError } from '../../../errors';

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  data: {
    email
  }
  req?: PayloadRequest
  overrideAccess: boolean
}

async function localUnlock<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<boolean> {
  const {
    collection: collectionSlug,
    data,
    overrideAccess = true,
    req = {} as PayloadRequest,
  } = options;

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
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
