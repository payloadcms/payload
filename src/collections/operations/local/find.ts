import { TypeWithID } from '../../config/types';
import { PaginatedDocs } from '../../../mongoose/types';
import { Document, Where } from '../../../types';

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

export default async function find<T extends TypeWithID = any>(options: Options): Promise<PaginatedDocs<T>> {
  const {
    collection: collectionSlug,
    depth,
    page,
    limit,
    where,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    sort,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.find({
    depth,
    sort,
    page,
    limit,
    where,
    collection,
    overrideAccess,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}
