import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import { TypeWithID } from '../../config/types';
import findOne from '../findOne';

export type Options = {
  slug: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  draft?: boolean
}

export default async function findOneLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<T> {
  const {
    slug: globalSlug,
    depth,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    draft = false,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);

  return findOne({
    slug: globalSlug,
    depth,
    globalConfig,
    overrideAccess,
    showHiddenFields,
    draft,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload,
    } as PayloadRequest,
  });
}
