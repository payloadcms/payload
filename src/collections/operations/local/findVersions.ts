import { Payload } from '../../..';
import { Document, Where } from '../../../types';
import { PaginatedDocs } from '../../../mongoose/types';
import { TypeWithVersion } from '../../../versions/types';
import { PayloadRequest } from '../../../express/types';
import findVersions from '../findVersions';
import { getDataLoader } from '../../dataloader';
import i18n from '../../../translations/init';

export type Options = {
  collection: string
  depth?: number
  page?: number
  limit?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  sort?: string
  where?: Where
}

export default async function findVersionsLocal<T extends TypeWithVersion<T> = any>(payload: Payload, options: Options): Promise<PaginatedDocs<T>> {
  const {
    collection: collectionSlug,
    depth,
    page,
    limit,
    where,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    sort,
  } = options;

  const collection = payload.collections[collectionSlug];

  const req = {
    user,
    payloadAPI: 'local',
    locale,
    fallbackLocale,
    payload,
    i18n: i18n(payload.config.i18n),
  } as PayloadRequest;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return findVersions({
    where,
    page,
    limit,
    depth,
    collection,
    sort,
    overrideAccess,
    showHiddenFields,
    req,
  });
}
