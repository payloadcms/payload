import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../../express/types.js';
import forgotPassword, { Result } from '../forgotPassword.js';
import { Payload } from '../../../payload.js';
import { getDataLoader } from '../../../collections/dataloader.js';
import { i18nInit } from '../../../translations/init.js';
import { APIError } from '../../../errors.js';
import { setRequestContext } from '../../../express/setRequestContext.js';

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  data: {
    email: string
  }
  expiration?: number
  disableEmail?: boolean
  req?: PayloadRequest
}

async function localForgotPassword<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    expiration,
    disableEmail,
    req = {} as PayloadRequest,
  } = options;
  setRequestContext(options.req);

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Forgot Password Operation.`);
  }

  req.payloadAPI = req.payloadAPI || 'local';
  req.payload = payload;
  req.i18n = i18nInit(payload.config.i18n);

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
