import { Payload } from '../../../payload';
import { getDataLoader } from '../../../collections/dataloader';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';
import findVersionByID from '../findVersionByID';
import i18nInit from '../../../translations/init';

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

export default async function findVersionByIDLocal<T extends TypeWithVersion<T> = any>(payload: Payload, options: Options): Promise<T> {
  const {
    slug: globalSlug,
    depth,
    id,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);
  const i18n = i18nInit(payload.config.i18n);

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

  return findVersionByID({
    depth,
    id,
    globalConfig,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req,
  });
}
