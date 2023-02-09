import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithVersion } from '../../../versions/types';
import findVersionByID from '../findVersionByID';
import { getDataLoader } from '../../dataloader';
import i18n from '../../../translations/init';
import { APIError } from '../../../errors';

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  id: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  disableErrors?: boolean
  req?: PayloadRequest
}

export default async function findVersionByIDLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<TypeWithVersion<GeneratedTypes['collections'][T]>> {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale = null,
    fallbackLocale = null,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req = {} as PayloadRequest,
  } = options;

  const collection = payload.collections[collectionSlug];
  const defaultLocale = payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null;

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
  }

  req.payloadAPI = 'local';
  req.locale = locale ?? req?.locale ?? defaultLocale;
  req.fallbackLocale = fallbackLocale ?? req?.fallbackLocale ?? defaultLocale;
  req.i18n = i18n(payload.config.i18n);
  req.payload = payload;

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return findVersionByID({
    depth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req,
  });
}
