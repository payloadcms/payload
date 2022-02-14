import { Document, Where } from '../../../types';
import { PaginatedDocs } from '../../../mongoose/types';
import { TypeWithVersion } from '../../../versions/types';

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
  disableErrors?: boolean
  sort?: string
  where?: Where
}

export default async function findVersions<T extends TypeWithVersion<T> = any>(options: Options): Promise<PaginatedDocs<T>> {
  const {
    slug: globalSlug,
    depth,
    page,
    limit,
    where,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    disableErrors = false,
    sort,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.findVersions({
    where,
    page,
    limit,
    depth,
    globalConfig,
    sort,
    overrideAccess,
    showHiddenFields,
    disableErrors,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}
