import { TypeWithID } from '../../config/types';
import { PaginatedDocs } from '../../../mongoose/types';
import { Document, Where } from '../../../types';
import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import find from '../find';

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
  pagination?: boolean
  sort?: string
  where?: Where
  draft?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function findLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<PaginatedDocs<T>> {
  const {
    collection: collectionSlug,
    depth,
    page,
    limit,
    where,
    locale = payload?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    sort,
    draft = false,
    pagination = true,
  } = options;

  const collection = payload.collections[collectionSlug];

  return find({
    depth,
    sort,
    page,
    limit,
    where,
    collection,
    overrideAccess,
    showHiddenFields,
    draft,
    pagination,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload,
    } as PayloadRequest,
  });
}
