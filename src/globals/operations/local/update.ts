import { Payload } from '../../../payload';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithID } from '../../config/types';
import update from '../update';
import { getDataLoader } from '../../../collections/dataloader';
import i18nInit from '../../../translations/init';
import { APIError } from '../../../errors';

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
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    data,
    user,
    overrideAccess = true,
    showHiddenFields,
    draft,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);
  const i18n = i18nInit(payload.config.i18n);

  if (!globalConfig) {
    throw new APIError(`The global with slug ${globalSlug} can't be found.`);
  }

  const req = {
    user,
    payloadAPI: 'local',
    locale,
    fallbackLocale,
    payload,
    i18n,
    t: i18n.t,
  } as PayloadRequest;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return update({
    slug: globalSlug,
    data,
    depth,
    globalConfig,
    overrideAccess,
    showHiddenFields,
    draft,
    req,
  });
}
