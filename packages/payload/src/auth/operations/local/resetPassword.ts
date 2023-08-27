import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload.js';
import resetPassword, { Result } from '../resetPassword.js';
import { PayloadRequest } from '../../../express/types.js';
import { getDataLoader } from '../../../collections/dataloader.js';
import { i18nInit } from '../../../translations/init.js';
import { APIError } from '../../../errors/index.js';
import { setRequestContext } from '../../../express/setRequestContext.js';

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  data: {
    token: string
    password: string
  }
  overrideAccess: boolean
  req?: PayloadRequest
}

async function localResetPassword<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    overrideAccess,
    req = {} as PayloadRequest,
  } = options;
  setRequestContext(options.req);

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Reset Password Operation.`);
  }

  req.payload = payload;
  req.payloadAPI = req.payloadAPI || 'local';
  req.i18n = i18nInit(payload.config.i18n as any);

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
