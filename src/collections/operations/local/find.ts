import { TypeWithID } from '../../config/types';
import { PaginatedDocs } from '../../../mongoose/types';
import { Document, Where } from '../../../types';
import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import find from '../find';
import { getDataLoader } from '../../dataloader';
import i18n from '../../../translations/init';
import { APIError } from '../../../errors';

export type Options = {
  collection: string
  depth?: number
  currentDepth?: number
  page?: number
  limit?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  disableErrors?: boolean
  showHiddenFields?: boolean
  pagination?: boolean
  sort?: string
  where?: Where
  draft?: boolean
  req?: PayloadRequest
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function findLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<PaginatedDocs<T>> {
  const {
    collection: collectionSlug,
    depth,
    currentDepth,
    page,
    limit,
    where,
    locale = null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    disableErrors,
    showHiddenFields,
    sort,
    draft = false,
    pagination = true,
    req = {} as PayloadRequest,
  } = options;

  const collection = payload.collections[collectionSlug];
  const defaultLocale = payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null;

  if (!collection) {
    throw new APIError(`The collection with slug ${collectionSlug} can't be found.`);
  }

  req.payloadAPI = 'local';
  req.locale = locale ?? req?.locale ?? defaultLocale;
  req.fallbackLocale = fallbackLocale ?? req?.fallbackLocale ?? defaultLocale;
  req.i18n = i18n(payload.config.i18n);
  req.payload = payload;

  if (!req.t) req.t = req.i18n.t;
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  if (typeof user !== 'undefined') req.user = user;

  return find({
    depth,
    currentDepth,
    sort,
    page,
    limit,
    where,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    draft,
    pagination,
    req,
  });
}
