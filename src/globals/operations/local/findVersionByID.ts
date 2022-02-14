import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';

export type Options = {
  slug: string
  id: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  disableErrors?: boolean
}

async function findVersionByID<T extends TypeWithVersion<T> = any>(options: Options): Promise<Document> {
  const {
    slug: globalSlug,
    depth,
    id,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.findVersionByID({
    slug: globalSlug,
    depth,
    id,
    globalConfig,
    overrideAccess,
    disableErrors,
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

export default findVersionByID;
