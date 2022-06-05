import { Payload } from '../../..';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithID } from '../../config/types';
import update from '../update';

export type Options = {
  slug: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  data: Record<string, unknown>
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  draft?: boolean
}

export default async function updateLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<T> {
  const {
    slug: globalSlug,
    depth,
    locale = payload.config.localization?.defaultLocale,
    fallbackLocale = null,
    data,
    user,
    overrideAccess = true,
    showHiddenFields,
    draft,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);

  return update({
    slug: globalSlug,
    data,
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
