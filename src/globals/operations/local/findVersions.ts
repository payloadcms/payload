import { Document, Where } from '../../../types';
import { PaginatedDocs } from '../../../mongoose/types';
import { TypeWithVersion } from '../../../versions/types';
import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import findVersions from '../findVersions';

export type Options = {
  slug: string
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
    slug: globalSlug,
    depth,
    page,
    limit,
    where,
    locale = payload.config.localization?.defaultLocale,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    sort,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);

  return findVersions({
    where,
    page,
    limit,
    depth,
    globalConfig,
    sort,
    overrideAccess,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload,
    } as PayloadRequest,
  });
}
