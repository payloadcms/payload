import { Payload } from '../../..';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithVersion } from '../../../versions/types';
import findVersionByID from '../findVersionByID';
import { getDataLoader } from '../../dataloader';

export type Options = {
  collection: string
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

export default async function findVersionByIDLocal<T extends TypeWithVersion<T> = any>(payload: Payload, options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    id,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req = {} as PayloadRequest,
  } = options;

  const collection = payload.collections[collectionSlug];

  req.payloadAPI = 'local';
  req.locale = locale || req?.locale || this?.config?.localization?.defaultLocale;
  req.fallbackLocale = fallbackLocale || req?.fallbackLocale || null;
  req.payload = payload;

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
