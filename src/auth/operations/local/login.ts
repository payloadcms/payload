import { Response } from 'express';
import login, { Result } from '../login';
import { PayloadRequest } from '../../../express/types';
import { TypeWithID } from '../../../collections/config/types';
import { Payload } from '../../..';
import { getDataLoader } from '../../../collections/dataloader';

export type Options = {
  collection: string
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

async function localLogin<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<Result & { user: T}> {
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

  const collection = payload.collections[collectionSlug];

  req.payloadAPI = 'local';
  req.payload = payload;
  req.locale = undefined;
  req.fallbackLocale = undefined;

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

  return login(args);
}

export default localLogin;
