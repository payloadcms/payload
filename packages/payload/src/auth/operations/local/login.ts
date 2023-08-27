import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import login, { Result } from '../login.js';
import { PayloadRequest } from '../../../express/types.js';
import { Payload } from '../../../payload.js';
import { getDataLoader } from '../../../collections/dataloader.js';
import { i18nInit } from '../../../translations/init.js';
import { APIError } from '../../../errors/index.js';
import { setRequestContext } from '../../../express/setRequestContext.js';

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  data: {
    email: string
    password: string
  }
  req?: PayloadRequest
  res?: Response
  depth?: number
  locale?: string
  fallbackLocale?: string
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function localLogin<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> {
  const {
    collection: collectionSlug,
    req = {} as PayloadRequest,
    res,
    depth,
    locale,
    fallbackLocale,
    data,
    overrideAccess = true,
    showHiddenFields,
  } = options;
  setRequestContext(options.req);


  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Login Operation.`);
  }

  req.payloadAPI = req.payloadAPI || 'local';
  req.payload = payload;
  req.i18n = i18nInit(payload.config.i18n as any);
  req.locale = undefined;
  req.fallbackLocale = undefined;

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  const args = {
    depth,
    collection,
    overrideAccess,
    showHiddenFields,
    data,
    req,
    res,
  };

  if (locale) args.req.locale = locale;
  if (fallbackLocale) args.req.fallbackLocale = fallbackLocale;

  return login<TSlug>(args);
}

export default localLogin;
