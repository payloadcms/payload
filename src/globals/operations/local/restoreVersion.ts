import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { getDataLoader } from '../../../collections/dataloader';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import restoreVersion from '../restoreVersion';
import i18nInit from '../../../translations/init';
import { APIError } from '../../../errors';

export type Options<T extends keyof GeneratedTypes['globals']> = {
  slug: string
  id: string
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export default async function restoreVersionLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['globals'][T]> {
  const {
    slug: globalSlug,
    depth,
    id,
    user,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);
  const i18n = i18nInit(payload.config.i18n);

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`);
  }

  const req = {
    user,
    payloadAPI: 'local',
    payload,
    locale,
    fallbackLocale,
    i18n,
    t: i18n.t,
  } as PayloadRequest;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return restoreVersion({
    depth,
    globalConfig,
    overrideAccess,
    id,
    showHiddenFields,
    req,
  });
}
