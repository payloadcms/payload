import { TypeWithID } from '../../config/types';
import { PaginatedDocs } from '../../../mongoose/types';
import { Document, Where } from '../../../types';
import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import find from '../find';
import { getDataLoader } from '../../dataloader';

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
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    disableErrors,
    showHiddenFields,
    sort,
    draft = false,
    pagination = true,
    req,
  } = options;

  const collection = payload.collections[collectionSlug];

  const reqToUse = {
    user: undefined,
    ...req || {},
    payloadAPI: 'local',
    locale: locale || req?.locale || (payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null),
    fallbackLocale: fallbackLocale || req?.fallbackLocale || null,
    payload,
  } as PayloadRequest;

  reqToUse.payloadDataLoader = getDataLoader(reqToUse);

  if (typeof user !== 'undefined') reqToUse.user = user;

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
    req: reqToUse,
  });
}
